/**
 * action-receipt-fence — site-wide CI gate around discrete-event handlers.
 *
 * Two physics, one set: every `onClick` / `onSubmit` / `onCopy` / `onShare`
 * handler in `app/` + `components/` either rides one of the canonical
 * receipt-bearing primitives (`ActionPressable`, `Pressable`, `Toast`,
 * `TextLink`, `Link`, `NextLink`) — OR carries an inline ledger comment
 * `// receipt-opt-out: <reason>` on the same source line, justifying the
 * silence. No third path. No new tokens. No new motion. The fence pins
 * what already works and prevents the next contributor from shipping a
 * silent button at 11 pm.
 *
 * Same shape as the three sibling fences; rides the kernel transport
 * without touching it (Mike #94 §4 stack-inversion test — adding an AST
 * dep here would give the next coder a fifth way to walk JSX). Pure
 * source-string lint. No DOM, no React render, no Jest jsdom warmup.
 *
 *   Axis A — Discrete-handler inventory.
 *     Every JSX opening tag in scope is decomposed into (host, attrs);
 *     each `onClick` / `onSubmit` / `onCopy` / `onShare` attribute
 *     surfaces as one candidate. Comments and template bodies are blanked
 *     by the kernel walker, so doc prose ("a future onClick={…}") cannot
 *     trigger.
 *
 *   Axis B — Host classification.
 *     Allowlist (capitalized): `ActionPressable | Pressable | Toast |
 *     TextLink | Link | NextLink` — the canonical receipt-bearing hosts.
 *     Custom React components NOT in the allowlist are presumed to bottom
 *     out on one of these primitives — the fence walks the tree and the
 *     leaf catches the silent button regardless of intermediate
 *     composition (Mike napkin §6 — kernel-first, not AST). Lowercase
 *     hosts (`button`, `div`, `span`, `a`, `form`) are raw DOM and fail
 *     without an explicit opt-out.
 *
 *   Axis C — Ledger opt-out grep.
 *     `// receipt-opt-out: <reason>` on the handler line is first-class
 *     (Paul §6 / Mike §6). The reason is captured for review (rendered
 *     in the failure body when adjacent violations exist), never asserted
 *     for content — abuse is visible at a glance, not by lint.
 *
 *   Axis D — Reduced-motion peer (read-only assertion).
 *     The universal `@media (prefers-reduced-motion: reduce)` block in
 *     `app/globals.css` survives. We do NOT extend the lean-arrow Axis
 *     F.2 pin; we lookup the same selector pattern and confirm the
 *     reduced-motion floor is intact. Re-uses the read; does not write.
 *
 * Failure prose is the product (Mike §6, Tanya §2). Three blocks per
 * violation: `loc — summary` / `detail` / `prescription`. The contributor
 * sees this at 11 pm under fluorescent lights — match the verb-tense of
 * `formatLabelFailure` and `formatDoorFailure`. The fence teaches by
 * failing well.
 *
 * Scope:
 *   IN  — `app/**`, `components/**` (the reader-facing surface)
 *   OUT — `__tests__/**` (test fixtures call handlers directly; pinned
 *         by the kernel walker's `isScannableFile`)
 *   OUT — `lib/**` (no JSX hosts; one consent voice per primitive lives
 *         under `components/`)
 *
 * Credits: Mike K. (architect napkin #94 §3 — the four-axis structural
 * template, the kernel-first / no-AST stance, the receipt-bearing-host
 * allowlist as a single readonly Set, the opt-out ledger comment as
 * first-class escape hatch, the failure-prose-as-product principle, the
 * "MH-2 / MH-3 killed to buy back the fence's budget" trim that scoped
 * this cycle); Tanya D. (UX #54 §0 + §7 — the Two-Rule doctrine the
 * fence pins, the "no toast for fingertip-local actions" disambiguation
 * that keeps Toast on the room-voice side, the §1 "no new layers" stance
 * that closes the door on a fifth fence growing from this one); Paul K.
 * (via Mike #94 — the falsifiable DoD shape, the audit-close-or-fence
 * pairing, the "navigation Link's receipt is the route change" mitigation
 * that landed Link in the allowlist); Elon M. (via Mike #94 — the two-rule
 * reduction "discrete actions get a receipt; gestures release to rest",
 * the perceptibility caveat that kept MH-1 OUT of this cycle); the
 * `_jsx-fence-walker.ts` kernel + `lean-arrow-fence.test.ts` template
 * — most decisions paid for already; this fence is the fourth tenant,
 * not the design.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  preloadFiles,
  readBalancedDelimiters,
  lineAt,
  formatBlock,
} from './_jsx-fence-walker';
import {
  RECEIPT_BEARING_HOSTS,
  RECEIPT_BEARING_HOST_SET,
  isAllowlistedHost,
  isCustomComponent,
  OPT_OUT_TOKEN,
} from '@/lib/design/__tests__/action-receipt-allowlist';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Scan footprint ────────────────────────────────────────────────────────

const SCAN_DIRS: readonly string[] = ['app', 'components'];

/** The four discrete-event handler attribute names this fence pins. */
const DISCRETE_HANDLERS: readonly string[] = ['onClick', 'onSubmit', 'onCopy', 'onShare'];

/** Per-fence preload — the kernel does the read; this binds to our SCAN_DIRS. */
const preloadAll = (): readonly { rel: string; src: string }[] => preloadFiles(SCAN_DIRS);

// ─── JSX opening-tag walker (rule-of-three not yet fired — keep inline) ──

interface JsxOpening { hostName: string; index: number; attrs: string; attrsStart: number }

/** Find every `<HostName ...>` opening tag and capture its attribute body. */
function findJsxOpenings(src: string): JsxOpening[] {
  const out: JsxOpening[] = [];
  for (const m of src.matchAll(/<([A-Za-z][\w.]*)\b/g)) {
    const start = (m.index ?? 0) + m[0].length;
    const end = findElementClose(src, start);
    if (end < 0) continue;
    out.push({ hostName: m[1], index: m.index ?? 0, attrs: src.slice(start, end), attrsStart: start });
  }
  return out;
}

/** Find the `>` that closes the opening tag, skipping over `{ ... }` blocks. */
function findElementClose(src: string, start: number): number {
  let i = start;
  while (i < src.length) {
    const c = src[i];
    if (c === '{') { const r = readBalancedDelimiters(src, i, '{', '}'); if (r === null) return -1; i = r.end + 1; continue; }
    if (c === '>') return i;
    i++;
  }
  return -1;
}

// ─── Handler attribute extractor ──────────────────────────────────────────

interface HandlerHit { name: string; offsetInAttrs: number }

/** Each `onX = {` in the attribute body, in source order. */
function extractHandlersFromAttrs(attrs: string): HandlerHit[] {
  const rx = /\b(onClick|onSubmit|onCopy|onShare)\s*=\s*\{/g;
  return [...attrs.matchAll(rx)].map((m) => ({
    name: m[1], offsetInAttrs: m.index ?? 0,
  }));
}

// ─── Candidate enumeration (Axis A) ───────────────────────────────────────

interface Candidate { file: string; line: number; host: string; handler: string }

/** Decompose one preprocessed source into the full candidate set. */
function enumerateCandidates(rel: string, src: string): Candidate[] {
  return findJsxOpenings(src).flatMap((op) =>
    extractHandlersFromAttrs(op.attrs).map((h) => ({
      file: rel,
      line: lineAt(src, op.attrsStart + h.offsetInAttrs),
      host: op.hostName,
      handler: h.name,
    })),
  );
}

let cachedCandidates: Candidate[] | null = null;

function scanAllCandidates(): Candidate[] {
  if (cachedCandidates !== null) return cachedCandidates;
  cachedCandidates = preloadAll()
    .filter(({ rel }) => rel.endsWith('.tsx'))
    .flatMap(({ rel, src }) => enumerateCandidates(rel, src));
  return cachedCandidates;
}

// ─── Raw-source opt-out detector (Axis C) ─────────────────────────────────
//
// The kernel preprocesses comments to spaces — by design, so doc prose
// cannot trigger a fence. The `receipt-opt-out:` ledger comment is part
// of the SOURCE contract though, not docs, so we re-read the raw file
// once per scanned tsx (mirrors the alpha-call-site-fence Axis D shape).

const rawCache: Map<string, readonly string[]> = new Map();

function rawLines(rel: string): readonly string[] {
  const hit = rawCache.get(rel);
  if (hit !== undefined) return hit;
  const lines = readFileSync(join(ROOT, rel), 'utf8').split(/\r?\n/);
  rawCache.set(rel, lines);
  return lines;
}

interface OptOut { ok: boolean; reason: string }

/** True iff `// receipt-opt-out: <reason>` sits on the handler's source line. */
function readOptOut(rel: string, line: number): OptOut {
  const text = rawLines(rel)[line - 1] ?? '';
  const idx = text.indexOf(OPT_OUT_TOKEN);
  if (idx < 0) return { ok: false, reason: '' };
  return { ok: true, reason: text.slice(idx + OPT_OUT_TOKEN.length).trim() };
}

// ─── Host classification (Axis B) ─────────────────────────────────────────

type Verdict =
  | { kind: 'allowlist' }            // host on the canonical set — pass
  | { kind: 'compose'; host: string } // custom Capitalized — presumed compose
  | { kind: 'opt-out'; reason: string } // opt-out comment honoured
  | { kind: 'fail'; host: string };  // raw DOM, no opt-out — fail

function classify(c: Candidate): Verdict {
  if (isAllowlistedHost(c.host)) return { kind: 'allowlist' };
  const opt = readOptOut(c.file, c.line);
  if (opt.ok) return { kind: 'opt-out', reason: opt.reason };
  if (isCustomComponent(c.host)) return { kind: 'compose', host: c.host };
  return { kind: 'fail', host: c.host };
}

// ─── Violation collection ─────────────────────────────────────────────────

interface Violation { file: string; line: number; host: string; handler: string }

function violationFrom(c: Candidate): Violation[] {
  const v = classify(c);
  if (v.kind === 'fail') return [{ file: c.file, line: c.line, host: c.host, handler: c.handler }];
  return [];
}

let cachedViolations: Violation[] | null = null;

function scanAllViolations(): Violation[] {
  if (cachedViolations !== null) return cachedViolations;
  cachedViolations = scanAllCandidates().flatMap(violationFrom);
  return cachedViolations;
}

// ─── Failure prose (Mike §6 — failure messages are documentation) ─────────

function formatViolation(v: Violation): string {
  const allow = RECEIPT_BEARING_HOSTS.join(' | ');
  const body =
    `    handler: ${v.handler}\n` +
    `    host:    <${v.host}> (not in receipt-bearing allowlist)\n` +
    `    fix A:   route through one of: ${allow}\n` +
    `    fix B:   add \`// ${OPT_OUT_TOKEN} <one-line reason>\` on the handler line\n` +
    `    why:     discrete actions get a receipt; silence is a feature, not a default`;
  return formatBlock(`${v.file}:${v.line}`, `discrete handler has no receipt`, body);
}

// ─── Tests — Axis A · candidate enumeration is non-empty ──────────────────

describe('action-receipt-fence — Axis A · discrete-handler inventory is non-empty', () => {
  it('the scan finds at least one onClick / onSubmit / onCopy / onShare in scope', () => {
    const total = scanAllCandidates().length;
    expect(total).toBeGreaterThanOrEqual(8);
  });

  it('the four canonical handler names are pinned (no quiet drift)', () => {
    expect([...DISCRETE_HANDLERS].sort()).toEqual(['onClick', 'onCopy', 'onShare', 'onSubmit']);
  });

  it('the scan walks at least one .tsx under app/ AND under components/', () => {
    const rels = preloadAll().filter(({ rel }) => rel.endsWith('.tsx')).map(({ rel }) => rel);
    expect(rels.some((r) => r.startsWith('app/'))).toBe(true);
    expect(rels.some((r) => r.startsWith('components/'))).toBe(true);
  });
});

// ─── Tests — Axis B · host classification (the load-bearing axis) ─────────

describe('action-receipt-fence — Axis B · every handler rides a receipt-bearing host or carries an opt-out', () => {
  it('no handler in scope hosts on a raw DOM element without an opt-out', () => {
    const violations = scanAllViolations();
    // Throw the formatted prose FIRST so the contributor reads the
    // prescription, not just a stringified array. The `expect` below is
    // the falsifiable guard that anchors the test's assertion shape.
    if (violations.length > 0) throw new Error('\n' + violations.map(formatViolation).join('\n\n'));
    expect(violations.map((v) => `${v.file}:${v.line} <${v.host}> ${v.handler}`)).toEqual([]);
  });

  it('the allowlist names exactly the six canonical receipt-bearing hosts', () => {
    expect([...RECEIPT_BEARING_HOST_SET].sort()).toEqual(
      ['ActionPressable', 'Link', 'NextLink', 'Pressable', 'TextLink', 'Toast'],
    );
  });

  it('every allowlisted name is also in the array form (single source of truth)', () => {
    expect([...RECEIPT_BEARING_HOSTS].sort()).toEqual([...RECEIPT_BEARING_HOST_SET].sort());
  });

  it('isCustomComponent agrees with the capitalisation contract', () => {
    expect(isCustomComponent('Pressable')).toBe(true);
    expect(isCustomComponent('button')).toBe(false);
    expect(isCustomComponent('')).toBe(false);
  });
});

// ─── Tests — Axis C · opt-out ledger token is honoured (and only this) ────

describe('action-receipt-fence — Axis C · receipt-opt-out is the only legal escape hatch', () => {
  it('the token spelling is fixed (a typo would silently mute violations)', () => {
    expect(OPT_OUT_TOKEN).toBe('receipt-opt-out:');
  });

  it('a synthetic raw-DOM handler with the opt-out comment classifies as opt-out', () => {
    const v = classifySynthetic('button', '<button onClick={x} /> // receipt-opt-out: native form submit');
    expect(v.kind).toBe('opt-out');
  });

  it('a synthetic raw-DOM handler WITHOUT the opt-out comment classifies as fail', () => {
    const v = classifySynthetic('button', '<button onClick={x} />');
    expect(v.kind).toBe('fail');
  });

  it('a synthetic Pressable handler classifies as allowlist regardless of opt-out', () => {
    const v = classifySynthetic('Pressable', '<Pressable onClick={x} />');
    expect(v.kind).toBe('allowlist');
  });
});

// ─── Tests — Axis D · reduced-motion floor is read-only and intact ────────

describe('action-receipt-fence — Axis D · reduced-motion floor in globals.css survives', () => {
  const cssPath = 'app/globals.css';
  const css = readFileSync(join(ROOT, cssPath), 'utf8');

  it('a `@media (prefers-reduced-motion: reduce)` block exists in globals.css', () => {
    expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{/);
  });

  it('at least one reduced-motion block silences the lean-arrow transform (Tanya §2.3)', () => {
    // Read-only sanity peer — the lean-arrow-fence Axis F.2 OWNS the
    // assertion that the override exists. We re-read the same invariant
    // here so a future contributor cannot delete the universal block
    // and only break a fence two directories away. Same logic, scoped
    // to "at least one block in the file mentions it" so the multiple
    // smaller @media reduce blocks (skiplink, etc.) don't false-positive.
    const blocks = extractAllReducedMotionBlocks(css);
    expect(blocks.length).toBeGreaterThanOrEqual(1);
    const carrier = blocks.find((b) => /\.lean-arrow/.test(b) && /transform:\s*none/.test(b));
    expect(carrier).not.toBeUndefined();
  });
});

// ─── Tests — Axis E · the fence is non-trivially wired to real call sites ─

describe('action-receipt-fence — Axis E · the fence is wired to live call sites', () => {
  it('the canonical Pressable host is exercised by at least one live .tsx', () => {
    const hits = scanAllCandidates().filter((c) => c.host === 'Pressable');
    expect(hits.length).toBeGreaterThanOrEqual(3);
  });

  it('the canonical ActionPressable host is exercised by at least two live .tsx', () => {
    // Floor lifted 1 → 2 alongside ShareOverlay's `mirror-share-confirm`
    // graduation (Mike #100 §4 / this PR). Speakers as of the lift:
    // ReturnLetter, QuoteKeepsake (×2), ThreadKeepsake (×2), ShareOverlay.
    // The literal floor stays conservative — the test is the *invariant*,
    // not the count; ratchet only when a future graduation re-shapes the
    // verb's population (Tanya UIX #99 §6, the verb-primitive rule of three).
    const hits = scanAllCandidates().filter((c) => c.host === 'ActionPressable');
    expect(hits.length).toBeGreaterThanOrEqual(2);
  });

  it('the audit-close pass left zero raw-DOM violations in the live tree', () => {
    expect(scanAllViolations()).toEqual([]);
  });
});

// ─── Test helpers — synthetic classifier + reduced-motion block reader ────
//
// Synthetic classifier: feeds a one-liner through the same pipeline a real
// file would take. Keeps Axis C honest without coupling the test to live
// source state — green even if every live raw-DOM site gets refactored.
// The underlying readOptOut reads from disk, so we shim a one-line raw
// cache via the same Map; sentinel filename is namespaced so production
// scans cannot collide.

function classifySynthetic(host: string, src: string): Verdict {
  const sentinelRel = `__synthetic__/axis-c/${host}.tsx`;
  rawCache.set(sentinelRel, [src]);
  const candidate: Candidate = { file: sentinelRel, line: 1, host, handler: 'onClick' };
  return classify(candidate);
}

/** Pull every `@media (prefers-reduced-motion: reduce) { ... }` body in source order. */
function extractAllReducedMotionBlocks(css: string): string[] {
  const rx = /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{/g;
  const out: string[] = [];
  for (const m of css.matchAll(rx)) {
    const open = (m.index ?? 0) + m[0].length - 1;
    const r = readBalancedDelimiters(css, open, '{', '}');
    if (r !== null) out.push(r.body);
  }
  return out;
}
