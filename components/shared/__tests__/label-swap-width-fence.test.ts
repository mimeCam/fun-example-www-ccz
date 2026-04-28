/**
 * label-swap-width-fence — host-scoped CI gate for the three label-swap
 * width floors.
 *
 * Five compositional `<ActionPressable>` carriers ride this primitive
 * (Mike #94 §2.1 — JSDoc carrier list on the host). The earlier three
 * hand-rolled `min-w-[Xrem]` floors collapsed into a three-rung helper
 * (Mike #39 §1, Tanya UX #41 §0); the carrier list grew to four (the
 * `<SelectionShareTrigger>` orphan-graduation), and now to five with the
 * Settled-Rhythm Rung Lock (Mike #94 §2 — secondary rows pinned at rung 1,
 * icon-only hosts honestly exempt). This fence is the bounding-box
 * invariant pinned in source: scan `<ActionPressable>` opening tags,
 * forbid bare `min-w-[Xrem]` literals on the className surface, AND
 * REQUIRE every host either compose `swapWidthClassOf(N)` (rung wire) OR
 * carry a `// swap-width:exempt — <reason>` token in the same comment
 * paragraph (honest exemption, single legal escape hatch).
 *
 * Four axes — kernel-first, no AST, ≤ 200 LOC of axis logic + bespoke
 * prose. Rides `_fence.ts` (the same kernel several other fences
 * already share — Mike §POI-3 "do not fork the walker").
 *
 *   Axis A — Host inventory.
 *     Every `<ActionPressable …>` opening tag in `app/` + `components/` is
 *     decomposed into (host, attrs). Comments and template bodies are
 *     blanked by the kernel walker, so doc prose ("a future
 *     `min-w-[5rem]` floor") cannot trigger.
 *
 *   Axis B — Forbid bare `min-w-[Xrem]` literals on action-swap surfaces.
 *     The `className` attribute body on each `<ActionPressable>` is read.
 *     Any `min-w-[<value>]` literal — string-literal value OR JSX-
 *     expression value (helper output is byte-identical, so a literal
 *     IN SOURCE means the helper was bypassed) — fails. The fence is
 *     SCOPED to action-swap hosts: legitimate layout uses of `min-w-[…]`
 *     elsewhere (modals, columns) are out of this fence's business
 *     (Mike #39 §POI-4 — host-scoped, not literal-scoped).
 *
 *   Axis C — Ledger opt-out shape (every exemption carries a reason).
 *     `// swap-width:exempt — <reason>` is the documented escape hatch
 *     (Mike #39 §POI-6, mirrors `// receipt-opt-out:` shape). Each token
 *     occurrence MUST carry a non-empty reason after the em-dash — abuse
 *     stays visible at a glance, drift cannot sneak in under a token-only
 *     comment.
 *
 *   Axis D — Helper-or-exempt invariant (the 5th-carrier rung lock).
 *     Every `<ActionPressable>` opening tag in scope either:
 *       (a) composes `swapWidthClassOf(N)` somewhere on its `className`,
 *           OR
 *       (b) sits inside a comment paragraph carrying the exempt token.
 *     The bounding box does not move during the `idle ↔ settled`
 *     crossfade at any host — pinned in source, not deferred to QA
 *     (Mike #94 §2 single invariant, Tanya UX #76 §3.2 felt-jitter).
 *
 * Failure prose is the product (Mike §6 / Tanya §2 — see action-receipt-
 * fence). Three blocks per violation: `loc — summary` / `detail` /
 * `prescription`. The contributor sees this at 11 pm under fluorescent
 * lights — the message names the three rungs and the helper they should
 * have used.
 *
 * Scope:
 *   IN  — `app/**`, `components/**` (the reader-facing surface)
 *   OUT — `__tests__/**` (kernel walker's `isScannableFile` excludes them)
 *   OUT — `lib/**` (no JSX hosts; the helper itself lives there)
 *
 * Credits: Mike K. (#39 napkin §3 / §POI-3 / §POI-4 — kernel-first fence,
 * host-bound scope, no codegen this cycle, the rule-of-three trigger that
 * promoted three magic numbers to one helper), Krystle C. (Axis F
 * authorship — the "fence the verb-tense swap, not the literal" call;
 * sprint shape and the four-call-site migration discipline), Tanya D.
 * (UX #41 §3 — the three-rung sizing table derived from labels, the
 * "chamber holds" felt sentence the fence pins below the surface), Elon
 * M. (kill list — "pin" overload, doctrine inflation, codegen-this-cycle
 * — refused; the 30-LOC viable-core call), Paul K. (DoD shape, anti-scope
 * discipline that kept the fence host-bound), Sid (this lift — fourth
 * tenant on the kernel, no new conventions, byte-identical helper output
 * keeps existing rendered-HTML tests green).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  preloadFiles,
  readBalancedDelimiters,
  lineAt,
  formatBlock,
  stripComments,
} from '../../../lib/design/__tests__/_fence';
import {
  SWAP_WIDTH_RUNGS,
  swapWidthClassOf,
  SWAP_WIDTH_EXEMPT_TOKEN,
} from '@/lib/design/swap-width';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Scan footprint ────────────────────────────────────────────────────────

/** Action-swap surfaces live under app/ + components/ only. */
const SCAN_DIRS: readonly string[] = ['app', 'components'];

/** The single host name this fence binds to (Mike §POI-4 — host-scoped). */
const HOST_NAME = 'ActionPressable';

/** Per-fence preload — kernel does the read; this binds to our SCAN_DIRS. */
const preloadAll = (): readonly { rel: string; src: string }[] =>
  preloadFiles(SCAN_DIRS);

// ─── JSX opening-tag walker (mirrors action-receipt-fence shape) ──────────

interface HostOpening {
  index: number;
  attrs: string;
  attrsStart: number;
}

/** Find every `<ActionPressable …>` opening tag and capture its attrs body. */
function findHostOpenings(src: string): HostOpening[] {
  const out: HostOpening[] = [];
  const rx = new RegExp(`<${HOST_NAME}\\b`, 'g');
  for (const m of src.matchAll(rx)) {
    const start = (m.index ?? 0) + m[0].length;
    const end = findElementClose(src, start);
    if (end < 0) continue;
    out.push({ index: m.index ?? 0, attrs: src.slice(start, end), attrsStart: start });
  }
  return out;
}

/** Find the `>` that closes the opening tag, skipping over `{ ... }` blocks. */
function findElementClose(src: string, start: number): number {
  let i = start;
  while (i < src.length) {
    const c = src[i];
    if (c === '{') {
      const r = readBalancedDelimiters(src, i, '{', '}');
      if (r === null) return -1;
      i = r.end + 1; continue;
    }
    if (c === '>') return i;
    i++;
  }
  return -1;
}

// ─── className body extraction ────────────────────────────────────────────

/**
 * Pull the body of a `className=…` attribute on the host. Returns the raw
 * substring between the quotes / braces, or `null` if absent. Pure, ≤ 10 LOC.
 */
function extractClassNameBody(attrs: string): string | null {
  const m = /\bclassName\s*=\s*(["'{])/.exec(attrs);
  if (m === null) return null;
  const open = m[1];
  if (open === '"' || open === '\'') return readQuotedBody(attrs, m.index + m[0].length, open);
  const r = readBalancedDelimiters(attrs, m.index + m[0].length - 1, '{', '}');
  return r === null ? null : r.body;
}

/** Read a single-line quoted string body up to the matching closing quote. */
function readQuotedBody(src: string, start: number, quote: string): string | null {
  const end = src.indexOf(quote, start);
  return end < 0 ? null : src.slice(start, end);
}

// ─── Violation detection (Axis B) ─────────────────────────────────────────

/** Match `min-w-[…]` Tailwind arbitrary-value classes (rem | px | …). */
const FORBIDDEN_LITERAL = /\bmin-w-\[[^\]]+\]/g;

interface Candidate { file: string; line: number; literal: string }

function findCandidatesIn(rel: string, src: string): Candidate[] {
  return findHostOpenings(src).flatMap((op) => candidatesForCall(rel, src, op));
}

function candidatesForCall(rel: string, src: string, op: HostOpening): Candidate[] {
  const body = extractClassNameBody(op.attrs);
  if (body === null) return [];
  return [...body.matchAll(FORBIDDEN_LITERAL)].map((m) => ({
    file: rel,
    line: lineAt(src, op.index),
    literal: m[0],
  }));
}

// ─── Raw-source opt-out detector (Axis C/D) ───────────────────────────────
//
// The kernel preprocesses comments to spaces; the `swap-width:exempt`
// ledger comment is part of the SOURCE contract, not docs, so we re-read
// the raw file once per scanned tsx (same pattern the action-receipt and
// alpha-call-site fences use).

interface RawCacheEntry { raw: readonly string[]; stripped: readonly string[] }
const rawCache: Map<string, RawCacheEntry> = new Map();

function rawAndStripped(rel: string): RawCacheEntry {
  const hit = rawCache.get(rel);
  if (hit !== undefined) return hit;
  const fileText = readFileSync(join(ROOT, rel), 'utf8');
  const entry: RawCacheEntry = {
    raw: fileText.split(/\r?\n/),
    stripped: stripComments(fileText).split(/\r?\n/),
  };
  rawCache.set(rel, entry);
  return entry;
}

interface OptOut { ok: boolean; reason: string }

/**
 * True iff `// swap-width:exempt …` sits on the call's line or in the
 * contiguous comment paragraph immediately above it. Walk upward in the
 * RAW source looking for the token; STOP when the corresponding STRIPPED
 * line has non-whitespace content (which means it's code, not a comment).
 * The kernel's `stripComments` blanks every comment line to spaces while
 * preserving newlines, so a code/comment boundary is one `trim() === ''`
 * away — abuse cannot sneak under a token two paragraphs above.
 */
function readOptOut(rel: string, line: number): OptOut {
  const { raw, stripped } = rawAndStripped(rel);
  for (let l = line; l >= 1; l--) {
    const text = raw[l - 1] ?? '';
    const idx = text.indexOf(SWAP_WIDTH_EXEMPT_TOKEN);
    if (idx >= 0) return { ok: true, reason: extractExemptReason(text, idx) };
    if (l < line && (stripped[l - 1] ?? '').trim() !== '') {
      return { ok: false, reason: '' };
    }
  }
  return { ok: false, reason: '' };
}

/** Reason text after `swap-width:exempt[ — ]`, stripped of comment tail. */
function extractExemptReason(text: string, idx: number): string {
  const tail = text.slice(idx + SWAP_WIDTH_EXEMPT_TOKEN.length);
  return tail.replace(/^\s*[—\-:]\s*/, '').replace(/\*\/\}?\s*$/, '').trim();
}

// ─── Violation collection ─────────────────────────────────────────────────

interface Violation { file: string; line: number; literal: string }

function violationFrom(c: Candidate): Violation[] {
  const opt = readOptOut(c.file, c.line);
  if (opt.ok) return [];
  return [{ file: c.file, line: c.line, literal: c.literal }];
}

let cachedViolations: Violation[] | null = null;

function scanAllViolations(): Violation[] {
  if (cachedViolations !== null) return cachedViolations;
  cachedViolations = preloadAll()
    .filter(({ rel }) => rel.endsWith('.tsx'))
    .flatMap(({ rel, src }) => findCandidatesIn(rel, src))
    .flatMap(violationFrom);
  return cachedViolations;
}

// ─── Failure prose (Mike §6 — failure messages are documentation) ─────────

function rungTable(): string {
  return SWAP_WIDTH_RUNGS
    .map((r, i) => `      rung ${i + 1} → ${swapWidthClassOf((i + 1) as 1 | 2 | 3)} (${r.pxNominal}px)`)
    .join('\n');
}

function formatViolation(v: Violation): string {
  const summary = `<${HOST_NAME}> carries bare '${v.literal}' on className`;
  const body =
    `    Bare \`min-w-[Xrem]\` literals on action-swap hosts are forbidden\n` +
    `    (Mike #39 §POI-4, Tanya UX #41 §3). Compose through the canonical\n` +
    `    helper from \`lib/design/swap-width.ts\`:\n\n` +
    rungTable() + `\n\n` +
    `    Replace the literal with the matching rung:\n` +
    `      className={swapWidthClassOf(N)}\n\n` +
    `    Or, if this is an honest one-off, add a same-line ledger comment:\n` +
    `      // ${SWAP_WIDTH_EXEMPT_TOKEN} — <reason>`;
  return formatBlock(`${v.file}:${v.line}`, summary, body);
}

// ─── Tests — Axis A · host inventory + sanity ─────────────────────────────

/** Five compositional carriers; mirrors the JSDoc on `<ActionPressable>`. */
const CANONICAL_CARRIERS: readonly string[] = [
  'components/return/ReturnLetter.tsx',
  'components/mirror/ShareOverlay.tsx',
  'components/articles/QuoteKeepsake.tsx',
  'components/reading/ThreadKeepsake.tsx',
  'components/resonances/SelectionShareTrigger.tsx',
];

describe('label-swap-width-fence — Axis A · <ActionPressable> inventory', () => {
  it('at least five <ActionPressable> opening tags exist in the scanned tree', () => {
    // The five carriers include two files (Quote/ThreadKeepsake) with two
    // host openings each (PrimaryShare + SecondaryAction); the floor is
    // therefore seven, not five. Assert the lower bound that proves the
    // fence isn't a no-op AND that the rung-lock saw the secondary rows.
    const total = preloadAll()
      .filter(({ rel }) => rel.endsWith('.tsx'))
      .reduce((n, { src }) => n + findHostOpenings(src).length, 0);
    expect(total).toBeGreaterThanOrEqual(7);
  });

  it('the five canonical carriers are all present in the scanned tree', () => {
    const rels = preloadAll()
      .filter(({ src }) => /\<ActionPressable\b/.test(src))
      .map(({ rel }) => rel);
    expect(rels).toEqual(expect.arrayContaining([...CANONICAL_CARRIERS]));
  });
});

// ─── Tests — Axis B · forbid bare min-w-[…] on the host ───────────────────

describe('label-swap-width-fence — Axis B · forbid bare min-w-[…] on <ActionPressable>', () => {
  it('no <ActionPressable> carries a bare min-w-[…] literal on className', () => {
    const violations = scanAllViolations();
    expect(violations.map((v) => `${v.file}:${v.line} ${v.literal}`)).toEqual([]);
    if (violations.length > 0) {
      throw new Error('\n' + violations.map(formatViolation).join('\n\n'));
    }
  });

  it('the rung table the failure prose names is non-empty (3 rungs)', () => {
    expect(rungTable().split('\n').length).toBe(3);
  });
});

// ─── Tests — Axis C · ledger opt-out shape ────────────────────────────────

interface ExemptOccurrence { file: string; line: number; reason: string }

function collectExemptOccurrences(): ExemptOccurrence[] {
  const out: ExemptOccurrence[] = [];
  for (const { rel } of preloadAll()) {
    if (!rel.endsWith('.tsx')) continue;
    const lines = readFileSync(join(ROOT, rel), 'utf8').split(/\r?\n/);
    lines.forEach((text, i) => {
      const idx = text.indexOf(SWAP_WIDTH_EXEMPT_TOKEN);
      if (idx >= 0) out.push({ file: rel, line: i + 1, reason: extractExemptReason(text, idx) });
    });
  }
  return out;
}

describe('label-swap-width-fence — Axis C · ledger opt-out shape', () => {
  it('SWAP_WIDTH_EXEMPT_TOKEN is the documented opt-out marker', () => {
    expect(SWAP_WIDTH_EXEMPT_TOKEN).toBe('swap-width:exempt');
  });

  it('every opt-out token carries a non-empty reason after the em-dash', () => {
    // The opt-out is first-class; abuse-prevention is the reason text.
    // A token-only comment (no reason) is the failure mode.
    const tokenless = collectExemptOccurrences().filter((o) => o.reason === '');
    expect(tokenless.map((o) => `${o.file}:${o.line}`)).toEqual([]);
  });

  it('only icon-only carriers carry the exempt token (Tanya UX #76 §3.2)', () => {
    // The two legal exemptions today: ShareOverlay.CopyLinkBtn and
    // SelectionShareTrigger — both `variant='icon' labelMode='hidden'`.
    // Any other file growing an exempt token earns a code review, not a
    // grandfathered pass.
    const allowed: ReadonlySet<string> = new Set([
      'components/mirror/ShareOverlay.tsx',
      'components/resonances/SelectionShareTrigger.tsx',
    ]);
    const carriers = new Set(collectExemptOccurrences().map((o) => o.file));
    for (const rel of carriers) expect(allowed.has(rel)).toBe(true);
  });
});

// ─── Tests — Axis D · helper-or-exempt invariant (the rung lock) ──────────

interface MissingHelper { file: string; line: number }

function findMissingHelper(rel: string, src: string): MissingHelper[] {
  return findHostOpenings(src)
    .filter((op) => !classNameComposesHelper(extractClassNameBody(op.attrs)))
    .map((op) => ({ file: rel, line: lineAt(src, op.index) }));
}

/** True iff the className body composes `swapWidthClassOf(…)` on this host. */
function classNameComposesHelper(body: string | null): boolean {
  if (body === null) return false;
  return /\bswapWidthClassOf\s*\(/.test(body);
}

interface HelperViolation { file: string; line: number }

function helperViolationsAcrossTree(): HelperViolation[] {
  return preloadAll()
    .filter(({ rel }) => rel.endsWith('.tsx'))
    .flatMap(({ rel, src }) => findMissingHelper(rel, src))
    .filter((m) => !readOptOut(m.file, m.line).ok);
}

function formatHelperFailure(v: HelperViolation): string {
  const summary = `<${HOST_NAME}> at ${v.file}:${v.line} has no rung wire`;
  const body =
    `    Every <${HOST_NAME}> host must compose \`swapWidthClassOf(N)\` so the\n` +
    `    bounding box does not move during the idle ↔ settled crossfade\n` +
    `    (Mike #94 §2 — single invariant).\n\n` +
    rungTable() + `\n\n` +
    `    Wire it on the host:\n` +
    `      <${HOST_NAME} … className={swapWidthClassOf(N)} />\n\n` +
    `    Or, if this is icon-only (\`labelMode='hidden'\` + same-size glyph\n` +
    `    swap), add a same-paragraph ledger comment with a reason:\n` +
    `      // ${SWAP_WIDTH_EXEMPT_TOKEN} — <reason>`;
  return formatBlock(`${v.file}:${v.line}`, summary, body);
}

describe('label-swap-width-fence — Axis D · helper-or-exempt invariant', () => {
  it('every <ActionPressable> host either composes swapWidthClassOf(N) or carries an exempt token', () => {
    const violations = helperViolationsAcrossTree();
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) {
      throw new Error('\n' + violations.map(formatHelperFailure).join('\n\n'));
    }
  });
});

// ─── Tests — kernel-binding sanity — the helper is the only authoring path ─

/** Carriers that wire a rung; the icon-only exempt carriers are excluded. */
const WIRED_CARRIERS: readonly string[] = [
  'components/return/ReturnLetter.tsx',
  'components/mirror/ShareOverlay.tsx',
  'components/articles/QuoteKeepsake.tsx',
  'components/reading/ThreadKeepsake.tsx',
];

describe('label-swap-width-fence — helper authoring path', () => {
  it('swapWidthClassOf(1..3) returns three byte-identical floor literals', () => {
    expect(swapWidthClassOf(1)).toBe('min-w-[5.5rem]');
    expect(swapWidthClassOf(2)).toBe('min-w-[6.5rem]');
    expect(swapWidthClassOf(3)).toBe('min-w-[14rem]');
  });

  it('every wired carrier imports the helper from @/lib/design/swap-width', () => {
    const rx = /from\s+['"]@\/lib\/design\/swap-width['"]/;
    for (const rel of WIRED_CARRIERS) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      expect(src).toMatch(rx);
    }
  });
});
