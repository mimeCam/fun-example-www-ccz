/**
 * alpha-call-site-fence — explicit-literal regression lint at every
 * `alphaClassOf(...)` invocation.
 *
 * The Alpha ledger ships a JIT-safe class factory at
 * `lib/design/alpha.ts` — `alphaClassOf(color, rung, kind?)` returns a
 * literal Tailwind class string from a fixed table. Tailwind's JIT can
 * only see class strings that exist in source as-written; the table is
 * pre-expanded for exactly that reason. The factory is the canonical
 * home; it survives JIT, theme switches, and forced-colors because the
 * decision lives in source as quoted literals.
 *
 * The silent-regression class this fence kills:
 *
 *   • A future caller writes `alphaClassOf(family, rung)` where one or
 *     both args are *variables*. The runtime still picks a string from
 *     the table — but the *decision* (which color, which rung) becomes
 *     ungreppable. Code-search for "where do we paint mist at recede?"
 *     misses it. Color/contrast review can no longer see the call.
 *   • A future caller writes `` `bg-${family}/${pct}` `` by hand and
 *     bypasses the table altogether. The Tailwind JIT does not see the
 *     class; the surface loses its bg/border/text at runtime; the
 *     `lib/design/__tests__/alpha-adoption.test.ts` line-pattern fence
 *     misses the template body (templates are blanked by the walker so
 *     prose docs cannot trigger). Drift slips past two reviews.
 *
 * Four axes, one fence — each is a string-content lint on raw source,
 * not a DOM test. They survive Tailwind JIT, server components, and
 * tree-shaking because they never touch React. Same shape as
 * `lean-arrow-fence.test.ts` (Axes A–F) and `voice-call-site-fence.test.ts`
 * (Axes A–D); the rule-of-three for the *test pattern* has now fired,
 * and the file walker / preload / strip / balanced-delim primitives
 * have lifted into `_fence.ts` (Mike #41 — kernel-lift
 * napkin; Krystle #20 — named lint #3; Elon §4 — walker is the layer
 * that drifts, not the formatter).
 *
 *   Axis A — Explicit color-family literal.
 *     Every `alphaClassOf(...)` call's first arg is a quoted string
 *     literal whose value is in `ALPHA_COLOR_FAMILIES`. No template
 *     literals, no variables, no ternaries — the family decision must
 *     be visible at the call site.
 *
 *   Axis B — Explicit rung literal.
 *     The second arg is a quoted string literal whose value is in
 *     `ALPHA_ORDER` (`hairline | muted | recede | quiet`). Same
 *     greppable-decision discipline as Axis A.
 *
 *   Axis C — Canonical import surface.
 *     `alphaClassOf` is imported from `@/lib/design/alpha` — no re-
 *     exports, no aliasing. One source, one seam (mirrors
 *     `voice-call-site-fence` Axis C: clipboard-utils is the seam).
 *
 *   Axis D — No bare-template alpha-class concatenation.
 *     No `(bg|text|border|shadow)-${…}/${…}` template-string
 *     construction in scope. If a future caller wants a translucent
 *     tinted surface, the only legal route is `alphaClassOf(...)`.
 *     This catches the JIT-bypass shape `alpha-adoption.test.ts`
 *     cannot see (because its walker blanks template bodies).
 *
 * Pure source-string lint. No DOM, no React render, no Jest jsdom
 * warmup. Each helper ≤ 10 LOC.
 *
 * Scope:
 *   IN  — `app/**`, `components/**` (the reader-facing surface)
 *   OUT — `__tests__/**` (test fixtures + audit modules call the
 *         factory directly with literals; pinned by the kernel walker)
 *   OUT — `lib/**` (the factory's own home + tables; canonical site)
 *
 * Credits: Mike K. (architect napkin #41 — the kernel-lift + lint #3
 * scope, the four-axis structural template lifted from
 * `voice-call-site-fence.test.ts`, the "fence sees template-bodies the
 * adoption test cannot" framing for Axis D, the keep-prose-bespoke
 * boundary that lets every formatXxx body stay local to this file);
 * Krystle C. (#20 — named the sprint, named the alpha-call-site-fence,
 * owns lint #3); Elon M. (#44 — walker-is-the-layer-that-drifts
 * teardown that motivates the kernel under this fence; the verify-by-
 * byte-identical-violation-strings gate); Paul K. (#64 — strategic
 * framing: this is plumbing protecting the keepsake feature; one
 * killer feature, polish it); Tanya D. (UIX #80 — Alpha Ledger 4-rung
 * vocabulary that this fence pins at every call site; UX §2 — "one
 * ambient-chrome voice on the Portal" — what this enforces at the
 * source-string level); the `voice-call-site-fence.test.ts` precedent
 * — most decisions paid for already; this fence is the third
 * sighting, not the design.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  preloadFiles,
  readBalancedDelimiters,
  lineAt,
} from '../../../lib/design/__tests__/_fence';
import {
  ALPHA_COLOR_FAMILIES,
  ALPHA_ORDER,
} from '@/lib/design/alpha';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Scan footprint (the walker primitives live in `_fence.ts`) ──────────

const SCAN_DIRS: readonly string[] = ['app', 'components'];

const ALLOWED_FAMILIES: ReadonlySet<string> = new Set<string>(ALPHA_COLOR_FAMILIES);
const ALLOWED_RUNGS: ReadonlySet<string> = new Set<string>(ALPHA_ORDER);
const ALLOWED_KINDS: ReadonlySet<string> = new Set(['bg', 'text', 'border', 'shadow']);

const CANONICAL_IMPORT = '@/lib/design/alpha';

/** Per-fence preload — the kernel does the read; this binds to our SCAN_DIRS. */
const preloadAll = (): readonly { rel: string; src: string }[] => preloadFiles(SCAN_DIRS);

// ─── Argument splitter (depth-aware comma split) ──────────────────────────

/**
 * Split a flat argument list on top-level commas, respecting nested
 * `(`/`{`/`[` depth so nested calls and object/array literals stay intact.
 * Pure, ≤ 10 LOC. Returns each arg's surface text, untrimmed boundaries.
 */
function splitTopLevelArgs(argsBody: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let last = 0;
  for (let i = 0; i < argsBody.length; i++) {
    const c = argsBody[i];
    if (c === '(' || c === '{' || c === '[') depth++;
    else if (c === ')' || c === '}' || c === ']') depth--;
    else if (c === ',' && depth === 0) { out.push(argsBody.slice(last, i)); last = i + 1; }
  }
  if (last <= argsBody.length) out.push(argsBody.slice(last));
  return out;
}

// ─── Call-site extractor ──────────────────────────────────────────────────

interface CallSite { index: number; args: string[] }

/**
 * Find every `alphaClassOf(` invocation and capture its argument list,
 * already split on top-level commas. The match index points at the `a`
 * of the verb.
 */
function findAlphaCalls(src: string): CallSite[] {
  const out: CallSite[] = [];
  for (const m of src.matchAll(/\balphaClassOf\s*\(/g)) {
    const open = (m.index ?? 0) + m[0].length - 1;
    const r = readBalancedDelimiters(src, open, '(', ')');
    if (r !== null) out.push({ index: m.index ?? 0, args: splitTopLevelArgs(r.body) });
  }
  return out;
}

// ─── Literal classifier ───────────────────────────────────────────────────

/** Return the literal value if `arg` is a bare quoted string, else `null`. */
function literalValue(arg: string): string | null {
  const m = arg.trim().match(/^(['"])([^'"]*)\1$/);
  return m === null ? null : m[2];
}

/** Build a literal-or-violation entry for one positional arg. */
function classifyArg(
  arg: string | undefined, allowed: ReadonlySet<string>,
): 'ok' | 'missing' | { raw: string } {
  if (arg === undefined) return 'missing';
  const value = literalValue(arg);
  if (value === null) return { raw: arg.trim() };
  return allowed.has(value) ? 'ok' : { raw: arg.trim() };
}

// ─── Axis A · explicit color-family literal ───────────────────────────────

interface BadFamily { file: string; line: number; raw: string }

function scanBadFamilies(rel: string, src: string): BadFamily[] {
  return findAlphaCalls(src).flatMap((c) =>
    badFamilyAt(rel, src, c),
  );
}

function badFamilyAt(rel: string, src: string, c: CallSite): BadFamily[] {
  const verdict = classifyArg(c.args[0], ALLOWED_FAMILIES);
  if (verdict === 'ok') return [];
  const raw = verdict === 'missing' ? '<missing>' : verdict.raw;
  return [{ file: rel, line: lineAt(src, c.index), raw }];
}

let cachedBadFamilies: BadFamily[] | null = null;

function scanAllBadFamilies(): BadFamily[] {
  if (cachedBadFamilies !== null) return cachedBadFamilies;
  cachedBadFamilies = preloadAll().flatMap(({ rel, src }) => scanBadFamilies(rel, src));
  return cachedBadFamilies;
}

function formatBadFamily(v: BadFamily): string {
  return (
    `  ${v.file}:${v.line} — alphaClassOf(...) family arg ${v.raw} is not a literal\n\n` +
    `    Spell the family. Allowed: ${[...ALLOWED_FAMILIES].sort().join(' | ')}.\n` +
    `    No template literals, no variables, no ternaries — the\n` +
    `    family decision must be greppable from the source string alone.`
  );
}

// ─── Axis B · explicit rung literal ───────────────────────────────────────

interface BadRung { file: string; line: number; raw: string }

function scanBadRungs(rel: string, src: string): BadRung[] {
  return findAlphaCalls(src).flatMap((c) => badRungAt(rel, src, c));
}

function badRungAt(rel: string, src: string, c: CallSite): BadRung[] {
  const verdict = classifyArg(c.args[1], ALLOWED_RUNGS);
  if (verdict === 'ok') return [];
  const raw = verdict === 'missing' ? '<missing>' : verdict.raw;
  return [{ file: rel, line: lineAt(src, c.index), raw }];
}

let cachedBadRungs: BadRung[] | null = null;

function scanAllBadRungs(): BadRung[] {
  if (cachedBadRungs !== null) return cachedBadRungs;
  cachedBadRungs = preloadAll().flatMap(({ rel, src }) => scanBadRungs(rel, src));
  return cachedBadRungs;
}

function formatBadRung(v: BadRung): string {
  return (
    `  ${v.file}:${v.line} — alphaClassOf(...) rung arg ${v.raw} is not a literal\n\n` +
    `    Spell the rung. Allowed: ${[...ALLOWED_RUNGS].join(' | ')}.\n` +
    `    No template literals, no variables, no ternaries — the\n` +
    `    presence decision must be greppable at the call site.`
  );
}

// ─── Axis C · canonical import surface ────────────────────────────────────

interface BadImport { file: string; line: number; from: string }

/**
 * For every file that uses `alphaClassOf`, find its `import` and confirm
 * the source path is the canonical one. Narrow regex (one import per file
 * in practice) so the failure points at the actual offending line. The
 * walker preserves newlines under stripping, so `lineAt(src, ...)` agrees
 * with raw source line numbers.
 */
function scanBadImports(rel: string, src: string): BadImport[] {
  if (!/\balphaClassOf\b/.test(src)) return [];
  const m = src.match(/import\s*\{[^}]*\balphaClassOf\b[^}]*\}\s*from\s*(['"])([^'"]+)\1/);
  if (m === null) return [];
  if (m[2] === CANONICAL_IMPORT) return [];
  return [{ file: rel, line: lineAt(src, src.indexOf(m[0])), from: m[2] }];
}

let cachedBadImports: BadImport[] | null = null;

function scanAllBadImports(): BadImport[] {
  if (cachedBadImports !== null) return cachedBadImports;
  cachedBadImports = preloadAll().flatMap(({ rel, src }) => scanBadImports(rel, src));
  return cachedBadImports;
}

function formatBadImport(v: BadImport): string {
  return (
    `  ${v.file}:${v.line} — alphaClassOf imported from '${v.from}'\n\n` +
    `    Canonical import: '${CANONICAL_IMPORT}'.\n` +
    `    No re-exports, no aliasing — single source, single seam\n` +
    `    (alpha-adoption.test.ts owns the line-pattern grep-fence).`
  );
}

// ─── Axis D · no bare-template alpha-class concatenation ─────────────────
//
// Read the RAW source (templates included) so we can see exactly what the
// adoption-fence walker blanks. A scoped read — one extra readFileSync per
// scanned file in this fence only — is the correct shape: the kernel's
// memo is for shared transport; this axis needs the un-stripped source.

interface BareTemplate { file: string; line: number; match: string }

const BARE_TEMPLATE_RX =
  /(?<![\w-])(bg|text|border|shadow)-\$\{[^}]+\}\/\$?\{?[^}`]*\}?/g;

function readRaw(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function scanBareTemplates(rel: string): BareTemplate[] {
  const raw = readRaw(rel);
  return [...raw.matchAll(BARE_TEMPLATE_RX)].map((m) => ({
    file: rel, line: lineAt(raw, m.index ?? 0), match: m[0],
  }));
}

let cachedBareTemplates: BareTemplate[] | null = null;

function scanAllBareTemplates(): BareTemplate[] {
  if (cachedBareTemplates !== null) return cachedBareTemplates;
  cachedBareTemplates = preloadAll().flatMap(({ rel }) => scanBareTemplates(rel));
  return cachedBareTemplates;
}

function formatBareTemplate(v: BareTemplate): string {
  return (
    `  ${v.file}:${v.line} — bare template alpha class '${v.match}'\n\n` +
    `    Tailwind's JIT cannot see template-built class strings —\n` +
    `    the surface loses its bg/border/text at runtime. Route\n` +
    `    through alphaClassOf(family, rung, kind?) from\n` +
    `    '${CANONICAL_IMPORT}' so the literal lands in the bundle.`
  );
}

// ─── Tests — Axis A · explicit color-family literal ───────────────────────

describe("alpha-call-site-fence — Axis A · alphaClassOf() family arg is a literal in ALPHA_COLOR_FAMILIES", () => {
  it('no in-scope call site uses a non-literal or off-ledger family', () => {
    const violations = scanAllBadFamilies();
    expect(violations.map((v) => `${v.file}:${v.line} ${v.raw}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + violations.map(formatBadFamily).join('\n\n'));
  });

  it('the allow-list mirrors lib/design/alpha.ts ALPHA_COLOR_FAMILIES', () => {
    expect([...ALLOWED_FAMILIES].sort()).toEqual([...ALPHA_COLOR_FAMILIES].sort());
  });
});

// ─── Tests — Axis B · explicit rung literal ───────────────────────────────

describe("alpha-call-site-fence — Axis B · alphaClassOf() rung arg is a literal in ALPHA_ORDER", () => {
  it('no in-scope call site uses a non-literal or off-ledger rung', () => {
    const violations = scanAllBadRungs();
    expect(violations.map((v) => `${v.file}:${v.line} ${v.raw}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + violations.map(formatBadRung).join('\n\n'));
  });

  it('the allow-list names the four canonical rungs in ledger order', () => {
    expect([...ALLOWED_RUNGS]).toEqual(['hairline', 'muted', 'recede', 'quiet']);
  });
});

// ─── Tests — Axis C · canonical import surface ────────────────────────────

describe('alpha-call-site-fence — Axis C · alphaClassOf imported only from lib/design/alpha', () => {
  it('no in-scope file imports alphaClassOf from a non-canonical source', () => {
    const violations = scanAllBadImports();
    expect(violations.map((v) => `${v.file}:${v.line} ← ${v.from}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + violations.map(formatBadImport).join('\n\n'));
  });

  it('at least one in-scope file imports alphaClassOf from the canonical path', () => {
    const importers = preloadAll().filter(({ src }) =>
      new RegExp(`from\\s+(['"])${CANONICAL_IMPORT}\\1`).test(src) && /\balphaClassOf\b/.test(src),
    );
    expect(importers.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Tests — Axis D · no bare-template alpha-class concatenation ──────────

describe('alpha-call-site-fence — Axis D · no `(bg|text|border|shadow)-${…}/${…}` template construction', () => {
  it('no in-scope file builds an alpha class from a template literal', () => {
    const violations = scanAllBareTemplates();
    expect(violations.map((v) => `${v.file}:${v.line} ${v.match}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + violations.map(formatBareTemplate).join('\n\n'));
  });

  it('the allow-list of canonical kinds names the four legal property prefixes', () => {
    expect([...ALLOWED_KINDS].sort()).toEqual(['bg', 'border', 'shadow', 'text']);
  });
});

// ─── Sanity — the fence scans non-empty work ──────────────────────────────

describe('alpha-call-site-fence — scan footprint is not a no-op', () => {
  it('at least one alphaClassOf() call exists in the scanned tree', () => {
    const total = preloadAll().reduce((n, { src }) => n + findAlphaCalls(src).length, 0);
    expect(total).toBeGreaterThanOrEqual(1);
  });

  it('the scan walks at least one .tsx file under app/ or components/', () => {
    const tsxCount = preloadAll().filter(({ rel }) => rel.endsWith('.tsx')).length;
    expect(tsxCount).toBeGreaterThanOrEqual(1);
  });
});
