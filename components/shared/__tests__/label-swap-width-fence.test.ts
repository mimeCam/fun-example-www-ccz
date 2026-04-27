/**
 * label-swap-width-fence — host-scoped CI gate for the three label-swap
 * width floors.
 *
 * Three call sites previously hand-rolled three different `min-w-[Xrem]`
 * floors on `<ActionPressable>` to stop the bounding box reflowing on a
 * verb-tense label swap (Mike #39 §1, Tanya UX #41 §0). The rule of three
 * has fired. This fence does what the kernel-first siblings do: scan
 * `<ActionPressable>` opening tags, forbid bare `min-w-[Xrem]` literals on
 * the className surface, and route every host through the canonical
 * `swapWidthClassOf(n)` helper from `lib/design/swap-width.ts`.
 *
 * Three axes — kernel-first, no AST, ≤ 120 LOC of axis logic + bespoke
 * prose. Rides `_jsx-fence-walker.ts` (the same kernel three other fences
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
 *   Axis C — Ledger opt-out grep.
 *     `// swap-width:exempt — <reason>` on the call's source line marks an
 *     honest exemption (e.g., a temporary tolerate path during a multi-PR
 *     migration). First-class escape hatch, mirrors the spacing-ledger /
 *     receipt-opt-out precedent. Tolerate→forbid flipped in this PR — no
 *     grandfathered allowlist entries on day one (Mike #39 §POI-6).
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
} from './_jsx-fence-walker';
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

// ─── Raw-source opt-out detector (Axis C) ─────────────────────────────────
//
// The kernel preprocesses comments to spaces; the `swap-width:exempt`
// ledger comment is part of the SOURCE contract, not docs, so we re-read
// the raw file once per scanned tsx (same pattern the action-receipt and
// alpha-call-site fences use).

const rawCache: Map<string, readonly string[]> = new Map();

function rawLines(rel: string): readonly string[] {
  const hit = rawCache.get(rel);
  if (hit !== undefined) return hit;
  const lines = readFileSync(join(ROOT, rel), 'utf8').split(/\r?\n/);
  rawCache.set(rel, lines);
  return lines;
}

interface OptOut { ok: boolean; reason: string }

/** True iff `// swap-width:exempt …` sits on or near the call's source line. */
function readOptOut(rel: string, line: number): OptOut {
  // Inspect the call's line + the two lines above (an attribute may sit
  // on a dedicated source line; the comment may sit one line up). Keep
  // the lookup window tiny — abuse is visible at a glance, not by lint.
  for (let l = line; l >= Math.max(1, line - 2); l--) {
    const text = rawLines(rel)[l - 1] ?? '';
    const idx = text.indexOf(SWAP_WIDTH_EXEMPT_TOKEN);
    if (idx >= 0) return { ok: true, reason: text.slice(idx + SWAP_WIDTH_EXEMPT_TOKEN.length).trim() };
  }
  return { ok: false, reason: '' };
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

describe('label-swap-width-fence — Axis A · <ActionPressable> inventory', () => {
  it('at least one <ActionPressable> exists in the scanned tree (not a no-op)', () => {
    const total = preloadAll()
      .filter(({ rel }) => rel.endsWith('.tsx'))
      .reduce((n, { src }) => n + findHostOpenings(src).length, 0);
    expect(total).toBeGreaterThanOrEqual(4);
  });

  it('the four canonical call-sites are all present in the scanned tree', () => {
    const rels = preloadAll()
      .filter(({ src }) => /\<ActionPressable\b/.test(src))
      .map(({ rel }) => rel);
    expect(rels).toEqual(expect.arrayContaining([
      'components/return/ReturnLetter.tsx',
      'components/mirror/ShareOverlay.tsx',
      'components/articles/QuoteKeepsake.tsx',
      'components/reading/ThreadKeepsake.tsx',
    ]));
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

// ─── Tests — Axis C · ledger opt-out grep ─────────────────────────────────

describe('label-swap-width-fence — Axis C · ledger opt-out grep', () => {
  it('SWAP_WIDTH_EXEMPT_TOKEN is the documented opt-out marker', () => {
    expect(SWAP_WIDTH_EXEMPT_TOKEN).toBe('swap-width:exempt');
  });

  it('no opt-out comment appears in the scanned tree on day one (Mike §POI-6)', () => {
    // Tolerate→forbid flips in this PR. The four call-sites migrate in
    // the same diff; no grandfathered allowlist entries earn a token at
    // birth. Mirrors the Gesture Atlas closure shape.
    const carriers: string[] = [];
    for (const { rel, src } of preloadAll()) {
      if (!rel.endsWith('.tsx')) continue;
      // Scan the RAW file (kernel preprocessor blanks comments) — that
      // is exactly where the ledger token lives.
      const raw = readFileSync(join(ROOT, rel), 'utf8');
      if (raw.includes(SWAP_WIDTH_EXEMPT_TOKEN)) carriers.push(rel);
    }
    expect(carriers).toEqual([]);
  });
});

// ─── Tests — kernel-binding sanity — the helper is the only authoring path ─

describe('label-swap-width-fence — helper authoring path', () => {
  it('swapWidthClassOf(1..3) returns three byte-identical floor literals', () => {
    expect(swapWidthClassOf(1)).toBe('min-w-[5.5rem]');
    expect(swapWidthClassOf(2)).toBe('min-w-[6.5rem]');
    expect(swapWidthClassOf(3)).toBe('min-w-[14rem]');
  });

  it('the four canonical call-sites import the helper from @/lib/design/swap-width', () => {
    const callers = [
      'components/return/ReturnLetter.tsx',
      'components/mirror/ShareOverlay.tsx',
      'components/articles/QuoteKeepsake.tsx',
      'components/reading/ThreadKeepsake.tsx',
    ];
    const rx = /from\s+['"]@\/lib\/design\/swap-width['"]/;
    for (const rel of callers) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      expect(src).toMatch(rx);
    }
  });
});
