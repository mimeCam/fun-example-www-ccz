/**
 * gesture-call-site-fence — explicit-literal regression lint at every
 * `gestureClassesOf(...)` invocation. **5th tenant** of the shared
 * `_jsx-fence-walker` kernel.
 *
 * The Gesture Atlas ships a JIT-safe class factory at
 * `lib/design/gestures.ts` — `gestureClassesOf(verb)` returns a literal
 * Tailwind fragment (`"duration-<beat> ease-<ease>"`) from a fixed table.
 * Tailwind's JIT can only see class strings that exist in source as-
 * written; the table is pre-expanded for exactly that reason. The factory
 * is the canonical home; it survives JIT, theme switches, and reduced-
 * motion overrides because the decision lives in source as quoted literals.
 *
 * The silent-regression class this fence kills:
 *
 *   • A future caller writes `gestureClassesOf(verb)` where the arg is a
 *     *variable*. The runtime still picks a string from the table — but
 *     the *decision* (which gesture, which row) becomes ungreppable. PR
 *     review can no longer answer "where is `card-lift` actually used?"
 *   • A future caller writes `` `transition-all duration-${beat} ease-${ease}` ``
 *     by hand and bypasses the table altogether. The Tailwind JIT does
 *     not see the class; the surface loses its transition at runtime; the
 *     `motion-adoption.test.ts` line-pattern guard misses the template
 *     body (templates are blanked by the kernel walker so prose docs
 *     cannot trigger). Drift slips past two reviews.
 *   • A future contributor imports `gestureClassesOf` from a barrel re-
 *     export and the canonical seam dilutes — the lesson alpha & voice
 *     fences already paid for.
 *
 * Four axes, one fence — each is a string-content lint on raw source, not
 * a DOM test. They survive Tailwind JIT, server components, and tree-
 * shaking because they never touch React. Same shape as
 * `alpha-call-site-fence.test.ts` (Axes A–D) and `voice-call-site-fence.
 * test.ts` (Axes A–D); the kernel that makes this a one-PR shape lives in
 * `_jsx-fence-walker.ts` (Mike #41 — kernel-lift napkin).
 *
 *   Axis A — Explicit verb literal.
 *     Every `gestureClassesOf(...)` call's first arg is a quoted string
 *     literal whose value is in `GESTURE_VERBS` (`keyof typeof GESTURES`).
 *     No template literals, no variables, no ternaries — the verb
 *     decision must be visible at the call site.
 *
 *   Axis B — Canonical import surface.
 *     `gestureClassesOf` is imported from `@/lib/design/gestures` — no
 *     re-exports, no aliasing. One source, one seam.
 *
 *   Axis C — No bare `duration-* ease-*` class composition outside the
 *     factory's own home. The fence FORBIDS — it does not tolerate.
 *     If a future caller wants a duration/ease pair on a transition, the
 *     only legal route is `gestureClassesOf(verb)`. Catches the JIT-
 *     bypass shape `motion-adoption.test.ts` cannot see (templates). The
 *     migration grandfather list (`GESTURE_GRANDFATHERED_PATHS`) is closed
 *     at length 0 (Sid 2026-04-27, Mike #36) — it is preserved as the
 *     structural seam that names the doctrine, not as a tolerance window.
 *     Mirror of `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS` shape; same
 *     shrink-only doctrine, same closure receipt.
 *
 *   Axis D — Cross-verb coherence is structural.
 *     Trivial: it's one table; pin the fact that the same verb at any two
 *     sites resolves to the same row. Same-table-equals-same-output is
 *     the entire reason the typed-table-as-registry shape was chosen over
 *     comments-as-registry (Elon's correction; Mike #9 §"Tech-lead
 *     decision").
 *
 * Pure source-string lint. No DOM, no React render, no Jest jsdom warmup.
 * Each helper ≤ 10 LoC.
 *
 * Scope:
 *   IN  — `app/**`, `components/**` (the reader-facing surface)
 *   OUT — `__tests__/**` (test fixtures + audit modules call the factory
 *         directly with literals; pinned by the kernel walker)
 *   OUT — `lib/**` (the factory's own home + tables; canonical site)
 *
 * Credits: Mike K. (architect napkin #9 — the kernel-lift + 5th-tenant
 * scope, the four-axis structural template lifted from `alpha-call-site-
 * fence.test.ts`, the typed-table-as-registry shape that lets Axis A
 * lean on `keyof typeof GESTURES` directly), Tanya D. (UIX #78 — the
 * twelve-verb vocabulary that this fence pins at every call site),
 * Krystle C. (#20 — the 5th-tenant value-fence frame, kernel-rides-same-
 * rails framing), Elon M. (#33 — verbs-are-code-not-comments first-
 * principles teardown that motivates this fence's existence over a
 * comment-harvester alternative), Paul K. (#98 — the make-or-break
 * outcome statement: every gesture named, coherent, audited at build).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  preloadFiles,
  readBalancedDelimiters,
  lineAt,
} from './_jsx-fence-walker';
import {
  GESTURE_VERBS,
  GESTURE_GRANDFATHERED_PATHS,
  GESTURE_MOTION_ENDPOINT_PATHS,
  GESTURE_LEDGER_EXEMPT_TOKEN,
  gestureClassesOf,
} from '@/lib/design/gestures';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Scan footprint (the walker primitives live in `_jsx-fence-walker.ts`)

const SCAN_DIRS: readonly string[] = ['app', 'components'];

const ALLOWED_VERBS: ReadonlySet<string> = new Set<string>(GESTURE_VERBS);

const CANONICAL_IMPORT = '@/lib/design/gestures';

const GRANDFATHERED: ReadonlySet<string> = new Set<string>([
  ...GESTURE_GRANDFATHERED_PATHS,
  ...GESTURE_MOTION_ENDPOINT_PATHS,
]);

/** Per-fence preload — the kernel does the read; this binds to our SCAN_DIRS. */
const preloadAll = (): readonly { rel: string; src: string }[] => preloadFiles(SCAN_DIRS);

// ─── Argument splitter (depth-aware comma split) ──────────────────────────

/**
 * Split a flat argument list on top-level commas, respecting nested
 * `(`/`{`/`[` depth so nested calls and object/array literals stay intact.
 * Pure, ≤ 10 LoC. Returns each arg's surface text, untrimmed boundaries.
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
 * Find every `gestureClassesOf(` invocation and capture its argument list,
 * already split on top-level commas. The match index points at the `g`
 * of the verb.
 */
function findGestureCalls(src: string): CallSite[] {
  const out: CallSite[] = [];
  for (const m of src.matchAll(/\bgestureClassesOf\s*\(/g)) {
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

/** Build a literal-or-violation entry for the verb arg. */
function classifyVerb(
  arg: string | undefined,
): 'ok' | 'missing' | { raw: string } {
  if (arg === undefined) return 'missing';
  const value = literalValue(arg);
  if (value === null) return { raw: arg.trim() };
  return ALLOWED_VERBS.has(value) ? 'ok' : { raw: arg.trim() };
}

// ─── Axis A · explicit verb literal ───────────────────────────────────────

interface BadVerb { file: string; line: number; raw: string }

function scanBadVerbs(rel: string, src: string): BadVerb[] {
  return findGestureCalls(src).flatMap((c) => badVerbAt(rel, src, c));
}

function badVerbAt(rel: string, src: string, c: CallSite): BadVerb[] {
  const verdict = classifyVerb(c.args[0]);
  if (verdict === 'ok') return [];
  const raw = verdict === 'missing' ? '<missing>' : verdict.raw;
  return [{ file: rel, line: lineAt(src, c.index), raw }];
}

let cachedBadVerbs: BadVerb[] | null = null;

function scanAllBadVerbs(): BadVerb[] {
  if (cachedBadVerbs !== null) return cachedBadVerbs;
  cachedBadVerbs = preloadAll().flatMap(({ rel, src }) => scanBadVerbs(rel, src));
  return cachedBadVerbs;
}

function formatBadVerb(v: BadVerb): string {
  return (
    `  ${v.file}:${v.line} — gestureClassesOf(...) verb arg ${v.raw} is not a literal\n\n` +
    `    Spell the verb. Allowed: ${[...ALLOWED_VERBS].sort().join(' | ')}.\n` +
    `    No template literals, no variables, no ternaries — the\n` +
    `    gesture decision must be greppable from the source string alone.`
  );
}

// ─── Axis B · canonical import surface ────────────────────────────────────

interface BadImport { file: string; line: number; from: string }

/**
 * For every file that uses `gestureClassesOf`, find its `import` and
 * confirm the source path is the canonical one. Same shape as
 * `alpha-call-site-fence` Axis C; the walker preserves newlines under
 * stripping so `lineAt(src, ...)` agrees with raw source line numbers.
 */
function scanBadImports(rel: string, src: string): BadImport[] {
  if (!/\bgestureClassesOf\b/.test(src)) return [];
  const m = src.match(/import\s*\{[^}]*\bgestureClassesOf\b[^}]*\}\s*from\s*(['"])([^'"]+)\1/);
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
    `  ${v.file}:${v.line} — gestureClassesOf imported from '${v.from}'\n\n` +
    `    Canonical import: '${CANONICAL_IMPORT}'.\n` +
    `    No re-exports, no aliasing — single source, single seam.`
  );
}

// ─── Axis C · no bare `duration-* ease-*` outside helper ─────────────────
//
// Read the RAW source (templates included) so the JIT-bypass shape
// `` `duration-${b} ease-${e}` `` is visible. Also catches honestly-spelled
// `duration-hover ease-out` literals outside `gestureClassesOf`. Per-line
// `// gesture-ledger:exempt — <reason>` carve-outs honor honest endpoints.
// Path allowlist absorbs the migration grandfather list + the Motion-
// endpoint module.

interface BareGesture { file: string; line: number; match: string }

/** Match `duration-<word>` followed by whitespace and `ease-<word>` —
 *  the Tailwind composition this fence governs. Either may be a `${…}`
 *  template fragment; the regex matches both shapes via `[\w$\\{}]+`. */
const BARE_GESTURE_RX =
  /(?<![\w-])duration-[\w${}]+\s+ease-[\w${}]+/g;

function readRaw(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function isExemptLine(raw: string, idx: number): boolean {
  const lineStart = raw.lastIndexOf('\n', idx) + 1;
  const lineEnd = raw.indexOf('\n', idx);
  const slice = raw.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  return slice.includes(GESTURE_LEDGER_EXEMPT_TOKEN);
}

function scanBareGestures(rel: string): BareGesture[] {
  if (GRANDFATHERED.has(rel)) return [];
  const raw = readRaw(rel);
  return [...raw.matchAll(BARE_GESTURE_RX)]
    .filter((m) => !isExemptLine(raw, m.index ?? 0))
    .map((m) => ({ file: rel, line: lineAt(raw, m.index ?? 0), match: m[0] }));
}

let cachedBareGestures: BareGesture[] | null = null;

function scanAllBareGestures(): BareGesture[] {
  if (cachedBareGestures !== null) return cachedBareGestures;
  cachedBareGestures = preloadAll().flatMap(({ rel }) => scanBareGestures(rel));
  return cachedBareGestures;
}

function formatBareGesture(v: BareGesture): string {
  return (
    `  ${v.file}:${v.line} — bare gesture-class composition '${v.match}'\n\n` +
    `    Route through gestureClassesOf(verb) from\n` +
    `    '${CANONICAL_IMPORT}' so the felt sentence is named at the\n` +
    `    call site. Inline carve-out: '// ${GESTURE_LEDGER_EXEMPT_TOKEN}\n` +
    `    — <reason>' on the same line for honest endpoints.`
  );
}

// ─── Tests — Axis A · explicit verb literal ───────────────────────────────

describe("gesture-call-site-fence — Axis A · gestureClassesOf() verb arg is a literal in GESTURE_VERBS", () => {
  it('no in-scope call site uses a non-literal or off-ledger verb', () => {
    const violations = scanAllBadVerbs();
    expect(violations.map((v) => `${v.file}:${v.line} ${v.raw}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + violations.map(formatBadVerb).join('\n\n'));
  });

  it('the allow-list mirrors lib/design/gestures.ts GESTURE_VERBS', () => {
    expect([...ALLOWED_VERBS].sort()).toEqual([...GESTURE_VERBS].sort());
  });
});

// ─── Tests — Axis B · canonical import surface ────────────────────────────

describe('gesture-call-site-fence — Axis B · gestureClassesOf imported only from lib/design/gestures', () => {
  it('no in-scope file imports gestureClassesOf from a non-canonical source', () => {
    const violations = scanAllBadImports();
    expect(violations.map((v) => `${v.file}:${v.line} ← ${v.from}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + violations.map(formatBadImport).join('\n\n'));
  });

  it('at least one in-scope file imports gestureClassesOf from the canonical path', () => {
    const importers = preloadAll().filter(({ src }) =>
      new RegExp(`from\\s+(['"])${CANONICAL_IMPORT}\\1`).test(src)
        && /\bgestureClassesOf\b/.test(src),
    );
    expect(importers.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Tests — Axis C · no bare `duration-* ease-*` outside helper ─────────

describe('gesture-call-site-fence — Axis C · no `duration-X ease-Y` outside the factory', () => {
  it('no in-scope file (outside the grandfather list) builds a bare gesture-class pair', () => {
    const violations = scanAllBareGestures();
    expect(violations.map((v) => `${v.file}:${v.line} ${v.match}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + violations.map(formatBareGesture).join('\n\n'));
  });

  it('the grandfather list is closed at length 0 — the fence forbids new entries', () => {
    // Atlas closure (Sid 2026-04-27, Mike #36): doctrine flipped from
    // *tolerate* to *forbid*. A future contributor's "temporary" re-add is
    // a CI-red event, not a review-time conversation. The seam stays so
    // the doctrine has a named home; the list stays empty by design.
    expect(GESTURE_GRANDFATHERED_PATHS.length).toBe(0);
  });
});

// ─── Tests — Axis D · cross-verb coherence is structural ──────────────────

describe('gesture-call-site-fence — Axis D · same verb resolves to same row everywhere', () => {
  it('two calls to the same verb produce byte-identical class strings', () => {
    GESTURE_VERBS.forEach((v) => expect(gestureClassesOf(v)).toBe(gestureClassesOf(v)));
  });

  it("the table is the registry — there is no second source to disagree with", () => {
    const seen = new Set<string>();
    GESTURE_VERBS.forEach((v) => seen.add(gestureClassesOf(v)));
    expect(seen.size).toBeGreaterThan(0);
    expect(seen.size).toBeLessThanOrEqual(GESTURE_VERBS.length);
  });
});

// ─── Sanity — the fence scans non-empty work ──────────────────────────────

describe('gesture-call-site-fence — scan footprint is not a no-op', () => {
  it('at least one gestureClassesOf() call exists in the scanned tree', () => {
    const total = preloadAll().reduce((n, { src }) => n + findGestureCalls(src).length, 0);
    expect(total).toBeGreaterThanOrEqual(1);
  });

  it('the scan walks at least one .tsx file under app/ or components/', () => {
    const tsxCount = preloadAll().filter(({ rel }) => rel.endsWith('.tsx')).length;
    expect(tsxCount).toBeGreaterThanOrEqual(1);
  });
});
