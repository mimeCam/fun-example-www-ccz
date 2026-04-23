/**
 * clipboard-envelope — pure builders for the static clipboard artifact.
 *
 * Emits a two-MIME payload:
 *   • `text/plain` — byte-identical to today's `writeText(text)` output.
 *     Terminals, password fields, and `⌘⇧V` see zero delta.
 *   • `text/html`  — a semantic `<blockquote cite="URL">` + `<cite>`
 *     attribution, with a 3px dormant-accent left rule (the single
 *     inline style we own). Rich-paste targets (Apple Notes, Notion,
 *     Gmail, Docs, Bear) render it as a cited quote; plain targets see
 *     the plain MIME. Sanitizer-robust: no `<script>`, no `<style>`, no
 *     classes, no remote `url()`, no `background-color` — Mike §2.
 *
 * Deterministic by construction. The builder DOES NOT import thermal
 * tokens, read `document`, or read `window`. Same input → same bytes.
 * That invariance is the feature (Mike §Points 1 + 7, Tanya §6).
 *
 * Thermal is preserved only as an optional HTML comment, off by default
 * (Mike §10). Human recipients never see it; machine-readable if any
 * future "paste back into the blog" receiver wants it.
 *
 * Credits: Mike K. (napkin — the pure-module split, escape-not-sanitize
 * discipline, byte-identity invariant, the 10-point coder guide),
 * Tanya D. (UX spec — anatomy of the left-rule + italic <cite>, the
 * refused atoms list, forced-colors handback, em-dash + space glyph),
 * Elon-style first-principles review (the static + citation-rich salvage,
 * HTML-comment idea), Paul K. (the viral "wait, what is this?" framing
 * that the `cite` URL delivers without tint), Authors of `share-card.ts`
 * / `svg-to-png.ts` (the `ClipboardItem` multi-MIME prior art).
 */

import { ACCENT } from '@/lib/thermal/thermal-tokens';

/** Reader-supplied envelope shape. Every field optional — text alone is valid. */
export interface EnvelopeInput {
  /** Canonical URL of the source (populates `cite=""` + the attribution link). */
  readonly cite?: string;
  /** Article title for the attribution line (`— title`). */
  readonly title?: string;
  /** Author name, appended after the title (`— title · author`). */
  readonly author?: string;
  /** BCP-47 language tag for `<blockquote lang="">` (accessibility polish). */
  readonly lang?: string;
  /** Optional thermal token for `<!-- thermal: <value> -->`. Off by default. */
  readonly thermalComment?: string;
}

/** Two-MIME payload — same shape the `ClipboardItem` constructor wants. */
export interface ClipboardPayload {
  readonly plain: string;
  readonly html: string;
}

// ─── Atoms (Tanya §5 — "the three atoms I care about most") ────────────────

/** Dormant-floor accent hex. Floors the rule so dark-mode paste targets
 *  never render brown-on-brown. Source: thermal-tokens ACCENT.dormant. */
const RULE_HEX = ACCENT.dormant;

/** `<cite>` colour — reader-invariant dim grey. Never warms. Tanya §5a.
 *  Foreign-DOM (the recipient's notes app); CSS vars cannot resolve there. */
// color-ledger:exempt — foreign-DOM (recipient's notes app), CSS vars do not resolve
const CITE_HEX = '#8a8a8a';

/** `radius-ledger:exempt` — foreign-DOM (recipient's notes app), CSS vars
 *  do not resolve. `0.375rem` = `RADIUS.soft` × left-corners only. Tanya §5c. */
const RULE_RADIUS = '0.375rem 0 0 0.375rem';

/** One `--sys-space` step of breathing between rule and text. Tanya §2a. */
const RULE_PADDING = '12px';

/** Em-dash + regular space. One consistent typographic mark. Tanya §6. */
const ATTRIBUTION_PREFIX = '— ';

// ─── Pure helpers (each ≤ 10 LOC) ──────────────────────────────────────────

/** HTML-entity escape. Safer than a 30KB sanitizer we don't audit (Mike §3). */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Drop trailing whitespace so the blockquote never has a dangling blank line. */
function trimTrailingNewlines(s: string): string {
  return s.replace(/[\n\r\s]+$/, '');
}

/** Inline style for the `<blockquote>` — left rule + padding + radius. */
function blockquoteStyle(): string {
  return [
    `margin: 0`,
    `padding: 4px 0 4px ${RULE_PADDING}`,
    `border-left: 3px solid ${RULE_HEX}`,
    `border-radius: ${RULE_RADIUS}`,
  ].join('; ');
}

/** Inline style for `<cite>` — italic + dim + slightly smaller. */
function citeStyle(): string {
  return `display: block; margin-top: 8px; font-style: italic; color: ${CITE_HEX}; font-size: 0.92em`;
}

/** Compose attribution body: "— title · author" (both optional). */
function attributionBody(title?: string, author?: string): string | null {
  const parts = [title, author].filter((p): p is string => !!p && p.trim().length > 0);
  if (parts.length === 0) return null;
  return ATTRIBUTION_PREFIX + parts.map(escapeHtml).join(' · ');
}

/** Render `<cite>` if we have a title OR author. Otherwise omit entirely. */
function renderCite(env: EnvelopeInput): string {
  const body = attributionBody(env.title, env.author);
  if (!body) return '';
  const anchor = env.cite
    ? `<a href="${escapeHtml(env.cite)}" style="color: inherit; text-decoration: none">${body}</a>`
    : body;
  return `<cite style="${citeStyle()}">${anchor}</cite>`;
}

/** Render opening blockquote tag with cite + lang attrs (both optional). */
function openBlockquote(env: EnvelopeInput): string {
  const attrs = [
    env.cite ? `cite="${escapeHtml(env.cite)}"` : null,
    env.lang ? `lang="${escapeHtml(env.lang)}"` : null,
    `style="${blockquoteStyle()}"`,
  ].filter((a): a is string => a !== null).join(' ');
  return `<blockquote ${attrs}>`;
}

/** Optional `<!-- thermal: X -->` suffix. Off by default (Mike §10). */
function thermalComment(env: EnvelopeInput): string {
  if (!env.thermalComment) return '';
  // Strip dashes from the value — `--` inside a comment is invalid HTML.
  const safe = env.thermalComment.replace(/--+/g, '-');
  return `<!-- thermal: ${safe} -->`;
}

// ─── Public builders ───────────────────────────────────────────────────────

/**
 * Build the HTML MIME part. Deterministic: same `(text, envelope)` pair
 * always yields byte-identical output. Do not pass thermal state in here.
 */
export function buildBlockquoteHtml(text: string, env: EnvelopeInput = {}): string {
  const body = escapeHtml(trimTrailingNewlines(text));
  const cite = renderCite(env);
  const thermal = thermalComment(env);
  return `${openBlockquote(env)}${body}${cite}</blockquote>${thermal}`;
}

/**
 * Build both MIME parts. `plain` is byte-identical to the input — any caller
 * pressing `⌘⇧V` or pasting into a terminal sees 2026-04-22's output exactly.
 */
export function buildClipboardPayload(text: string, env: EnvelopeInput = {}): ClipboardPayload {
  return {
    plain: text,
    html: buildBlockquoteHtml(text, env),
  };
}

/**
 * Feature detect — mirror of `svg-to-png.ts:68`. `ClipboardItem` is the
 * constructor that differs by vendor; Firefox Android, old WebKit, and
 * non-secure contexts all land here as `false` without throwing.
 */
export function isMultiMimeSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (!navigator.clipboard) return false;
  if (typeof (globalThis as { ClipboardItem?: unknown }).ClipboardItem !== 'function') return false;
  return typeof navigator.clipboard.write === 'function';
}
