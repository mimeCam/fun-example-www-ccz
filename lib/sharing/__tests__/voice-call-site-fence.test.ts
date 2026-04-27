/**
 * voice-call-site-fence — explicit-announce regression lint at the share path.
 *
 * The Keepsake share is the artifact that travels (Paul K., "Protect the
 * Pause"). If a future call site to `copyWithFeedback(...)` lands on the
 * default-quiet path *without spelling its decision*, the room voice
 * silently drifts — a fingertip surface might shout, a no-witness surface
 * might fall mute. Voice drift = pause drift.
 *
 * The helper's default-quiet behaviour stays intact (unit tests in
 * `clipboard-utils.test.ts` rely on it; helper-internal mocks rely on it).
 * What this fence enforces is at the **call site**: every reader-facing
 * invocation under `app/` and `components/` must declare `announce:`
 * literally — `'fingertip'` or `'room'`, no template literals, no ternaries,
 * no inferred default. The decision must be visible.
 *
 *   Axis A — Explicit `announce`.
 *     Every `copyWithFeedback(` invocation in scope includes `announce:`
 *     literally in its argument list.
 *
 *   Axis B — Allowed values only.
 *     The literal that follows `announce:` is `'fingertip'` or `'room'`.
 *     No expressions, no variables.
 *
 *   Axis C — Single import surface.
 *     `copyWithFeedback` is imported from `@/lib/sharing/clipboard-utils`
 *     (or its barrel). No re-exports, no aliasing.
 *
 *   Axis D — Share-failover voice.
 *     When `runShareFailover` is defined as a local function inside an
 *     in-scope file, its body's `copyWithFeedback(...)` call passes
 *     `announce: 'room'` (the no-fingertip-witness branch). Soft-skips
 *     when no `runShareFailover` exists in scope.
 *
 * Pure source-string lint. No DOM, no React render, no Jest jsdom warmup.
 * Same shape as `lean-arrow-fence.test.ts` (Mike rule of three: this is
 * verb-fence #2; the pattern earns a shared helper at #3, not now).
 *
 * Scope:
 *   IN  — `app/**`, `components/**` (the reader-facing surface)
 *   OUT — `__tests__/**` (test fixtures + mocks call the helper directly)
 *   OUT — `lib/**` (the helper's own home + barrels; out per Mike §5)
 *
 * Credits: Mike K. (`_reports/from-michael-koch-project-architect-76.md` —
 * the four-axis napkin verbatim, "Begin from shared code", "regression
 * lint, not doctrine"); Tanya D. (`_reports/from-tanya-donska-expert-uix-
 * designer-3.md` §9 — the voice-peer ratification: "voice-channel pinning
 * survives Elon's teardown"); Paul K. (cited via Mike — "Protect the
 * Pause" north star, the make-or-break outcome that motivates the lint);
 * Elon M. (cited via Mike §3 — narrowed the doctrine to two cheap lints);
 * Krystle C. (the per-verb fence shape this file copies verbatim from
 * `components/shared/__tests__/lean-arrow-fence.test.ts`); Sid (this
 * implementation — call-site explicit-announce fence + JSDoc tighten +
 * QuoteKeepsake/ThreadKeepsake announce: 'fingertip' make-explicit).
 */

import {
  preloadFiles,
  readBalancedDelimiters,
  lineAt,
} from '@/components/shared/__tests__/_jsx-fence-walker';

// ─── Scan footprint (the walker primitives live in `_jsx-fence-walker.ts`) ─

const SCAN_DIRS: readonly string[] = ['app', 'components'];

const ALLOWED_ANNOUNCE: ReadonlySet<string> = new Set(['fingertip', 'room']);

const CANONICAL_IMPORT = '@/lib/sharing/clipboard-utils';

/** Read a balanced `(…)` body and return just the substring (back-compat shape). */
function readBalancedParens(src: string, start: number): string | null {
  const r = readBalancedDelimiters(src, start, '(', ')');
  return r === null ? null : r.body;
}

/** Per-fence preload — the kernel does the read; this binds to our SCAN_DIRS. */
const preloadAll = (): readonly { rel: string; src: string }[] => preloadFiles(SCAN_DIRS);

// ─── Call-site extractor ──────────────────────────────────────────────────

interface CallSite { index: number; args: string }

/**
 * Find every `copyWithFeedback(` invocation and capture its argument
 * list. Pure, ≤ 10 LOC. The match index points at the `c` of the verb.
 */
function findCopyCalls(src: string): CallSite[] {
  const out: CallSite[] = [];
  for (const m of src.matchAll(/\bcopyWithFeedback\s*\(/g)) {
    const open = (m.index ?? 0) + m[0].length - 1;
    const args = readBalancedParens(src, open);
    if (args !== null) out.push({ index: m.index ?? 0, args });
  }
  return out;
}

// ─── Axis A · explicit `announce:` keyword ────────────────────────────────

interface MissingAnnounce { file: string; line: number }

const ANNOUNCE_KW = /\bannounce\s*:/;

function scanMissingAnnounce(rel: string, src: string): MissingAnnounce[] {
  return findCopyCalls(src).flatMap((c) =>
    ANNOUNCE_KW.test(c.args)
      ? []
      : [{ file: rel, line: lineAt(src, c.index) }],
  );
}

let cachedMissing: MissingAnnounce[] | null = null;

function scanAllMissingAnnounce(): MissingAnnounce[] {
  if (cachedMissing !== null) return cachedMissing;
  cachedMissing = preloadAll().flatMap(({ rel, src }) => scanMissingAnnounce(rel, src));
  return cachedMissing;
}

function formatMissingAnnounce(v: MissingAnnounce): string {
  return (
    `  ${v.file}:${v.line} — copyWithFeedback() missing 'announce:' keyword\n\n` +
    `    The default-quiet behaviour stays in the helper, but every\n` +
    `    reader-facing call site must spell its choice. Add\n` +
    `    'announce: \\'fingertip\\'' (caller owns the witness — pulse,\n` +
    `    glyph swap) or 'announce: \\'room\\'' (no fingertip; toast).`
  );
}

// ─── Axis B · the literal is 'fingertip' or 'room' ────────────────────────

interface BadAnnounceValue { file: string; line: number; raw: string }

/**
 * For every call that declares `announce:`, capture the substring after
 * the colon up to the next `,` or `}` and check it parses as one of the
 * two allowed string literals.
 */
const ANNOUNCE_VALUE = /\bannounce\s*:\s*([^,}]+?)(?=[,}])/g;

function scanBadAnnounceValues(rel: string, src: string): BadAnnounceValue[] {
  return findCopyCalls(src).flatMap((c) => valuesIn(rel, src, c));
}

function valuesIn(rel: string, src: string, c: CallSite): BadAnnounceValue[] {
  const out: BadAnnounceValue[] = [];
  for (const m of c.args.matchAll(ANNOUNCE_VALUE)) {
    const raw = m[1].trim();
    if (!isAllowedLiteral(raw)) {
      out.push({ file: rel, line: lineAt(src, c.index), raw });
    }
  }
  return out;
}

/** A bare `'fingertip'` or `'room'` (single or double quotes), nothing else. */
function isAllowedLiteral(raw: string): boolean {
  const m = raw.match(/^(['"])([^'"]*)\1$/);
  if (!m) return false;
  return ALLOWED_ANNOUNCE.has(m[2]);
}

let cachedBadValues: BadAnnounceValue[] | null = null;

function scanAllBadAnnounceValues(): BadAnnounceValue[] {
  if (cachedBadValues !== null) return cachedBadValues;
  cachedBadValues = preloadAll().flatMap(({ rel, src }) => scanBadAnnounceValues(rel, src));
  return cachedBadValues;
}

function formatBadValue(v: BadAnnounceValue): string {
  return (
    `  ${v.file}:${v.line} — announce: ${v.raw} is not a literal\n\n` +
    `    Spell the choice. Allowed: 'fingertip' | 'room'.\n` +
    `    No template literals, no variables, no ternaries — the\n` +
    `    decision must be greppable from the source string alone.`
  );
}

// ─── Axis C · canonical import surface ────────────────────────────────────

interface BadImport { file: string; line: number; from: string }

/**
 * For every file that uses `copyWithFeedback`, find its `import` and
 * confirm the source path is the canonical one. We keep the regex narrow
 * (one import statement per file in practice) so the failure points at
 * the actual offending line. The walker preserves newlines under stripping,
 * so `lineAt(src, ...)` agrees with the raw source line numbers.
 */
function scanBadImports(rel: string, src: string): BadImport[] {
  if (!/\bcopyWithFeedback\b/.test(src)) return [];
  const m = src.match(/import\s*\{[^}]*\bcopyWithFeedback\b[^}]*\}\s*from\s*(['"])([^'"]+)\1/);
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
    `  ${v.file}:${v.line} — copyWithFeedback imported from '${v.from}'\n\n` +
    `    Canonical import: '${CANONICAL_IMPORT}'.\n` +
    `    No re-exports, no aliasing — single source, single seam\n` +
    `    (clipboard-centrality.test.ts owns the writeText seam).`
  );
}

// ─── Axis D · share-failover voice opts into the room ─────────────────────

interface FailoverViolation { file: string; line: number; reason: string }

const FAILOVER_FN = /\b(?:async\s+)?function\s+runShareFailover\s*\([^)]*\)\s*:\s*Promise<[^>]+>\s*\{/g;

/**
 * Read the body of `runShareFailover`, find its `copyWithFeedback(...)`
 * invocation, and confirm `announce: 'room'` lives inside it. The room
 * voice is the only available witness in the no-`navigator.share` branch
 * (Paul K. — the silent share-failover is the worst regression).
 */
function scanFailoverBodies(rel: string, src: string): FailoverViolation[] {
  return [...src.matchAll(FAILOVER_FN)].flatMap((m) =>
    failoverViolationsAt(rel, src, m.index ?? 0, m[0].length),
  );
}

function failoverViolationsAt(
  rel: string, src: string, headIndex: number, headLen: number,
): FailoverViolation[] {
  const bodyOpen = headIndex + headLen - 1;
  const r = readBalancedDelimiters(src, bodyOpen, '{', '}');
  if (r === null) return [];
  return classifyFailover(rel, src, headIndex, r.body);
}

function classifyFailover(
  rel: string, src: string, headIndex: number, body: string,
): FailoverViolation[] {
  const calls = findCopyCalls(body);
  if (calls.length === 0) return [];
  if (calls.some((c) => /\bannounce\s*:\s*(['"])room\1/.test(c.args))) return [];
  return [{
    file: rel, line: lineAt(src, headIndex),
    reason: 'runShareFailover branch passes copyWithFeedback without announce: \'room\'',
  }];
}

let cachedFailover: FailoverViolation[] | null = null;

function scanAllFailoverBodies(): FailoverViolation[] {
  if (cachedFailover !== null) return cachedFailover;
  cachedFailover = preloadAll().flatMap(({ rel, src }) => scanFailoverBodies(rel, src));
  return cachedFailover;
}

function failoverFnExists(): boolean {
  return preloadAll().some(({ src }) => FAILOVER_FN.test(src));
}

function formatFailoverFailure(v: FailoverViolation): string {
  return (
    `  ${v.file}:${v.line} — ${v.reason}\n\n` +
    `    The no-fingertip-witness branch (no <ActionPressable> wraps\n` +
    `    the primary CTA when navigator.share is missing) MUST opt\n` +
    `    into the room voice — pass announce: 'room' so the toast\n` +
    `    becomes the only available receipt.`
  );
}

// ─── Tests — Axis A · explicit `announce:` ────────────────────────────────

describe("voice-call-site-fence — Axis A · every copyWithFeedback() spells 'announce:'", () => {
  it('no in-scope call site omits the announce keyword', () => {
    const violations = scanAllMissingAnnounce();
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + violations.map(formatMissingAnnounce).join('\n\n'));
  });

  it('at least one copyWithFeedback() call exists in the scanned tree (not a no-op test)', () => {
    const total = preloadAll().reduce((n, { src }) => n + findCopyCalls(src).length, 0);
    expect(total).toBeGreaterThanOrEqual(4);
  });
});

// ─── Tests — Axis B · allowed literal values only ─────────────────────────

describe("voice-call-site-fence — Axis B · announce: literal is 'fingertip' or 'room'", () => {
  it('no in-scope call site uses a non-literal announce value', () => {
    const violations = scanAllBadAnnounceValues();
    expect(violations.map((v) => `${v.file}:${v.line} ${v.raw}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + violations.map(formatBadValue).join('\n\n'));
  });

  it('the allow-list names the two canonical voice channels', () => {
    expect([...ALLOWED_ANNOUNCE].sort()).toEqual(['fingertip', 'room']);
  });
});

// ─── Tests — Axis C · canonical import surface ────────────────────────────

describe('voice-call-site-fence — Axis C · copyWithFeedback imported only from clipboard-utils', () => {
  it('no in-scope file imports copyWithFeedback from a non-canonical source', () => {
    const violations = scanAllBadImports();
    expect(violations.map((v) => `${v.file}:${v.line} ← ${v.from}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + violations.map(formatBadImport).join('\n\n'));
  });

  it('at least one in-scope file imports copyWithFeedback from the canonical path', () => {
    const importers = preloadAll().filter(({ src }) =>
      new RegExp(`from\\s+(['"])${CANONICAL_IMPORT}\\1`).test(src) && /\bcopyWithFeedback\b/.test(src),
    );
    expect(importers.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── Tests — Axis D · share-failover voice ────────────────────────────────

describe("voice-call-site-fence — Axis D · runShareFailover passes announce: 'room'", () => {
  it('every in-scope runShareFailover() opts into the room voice on its copyWithFeedback call', () => {
    if (!failoverFnExists()) return; // Soft-skip per Mike §4 axis D.
    const violations = scanAllFailoverBodies();
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + violations.map(formatFailoverFailure).join('\n\n'));
  });

  it('the failover function exists in scope today (sentinel — remove if/when the surface retires)', () => {
    expect(failoverFnExists()).toBe(true);
  });
});
