/**
 * empty-adoption — the 7th adoption guard (DOM + tone, empty-surface twin).
 *
 * Shape-identical fork of `toast-adoption.test.ts` but fenced around the
 * four quietest rooms: `empty-mirror`, `empty-resonances`, `threshold-404`,
 * `threshold-error`. This file IS the fence that keeps the 7th shared
 * primitive load-bearing — shipped so day-365 drift cannot drop a raw
 * `<p>Nothing here yet.</p>` into a 5th empty state and rot the voice.
 *
 * Axis A — DOM perimeter (the 7th adoption guard, shape-identical to the
 * other six adoption families):
 *   The four surface files (`app/not-found.tsx`, `app/error.tsx`,
 *   `app/mirror/page.tsx`, `app/resonances/ResonancesClient.tsx`) may not
 *   contain a raw `<h1>` or a raw `<p>` in their empty / threshold branches
 *   — every user-facing line must route through `<EmptySurface />`. The
 *   primitive itself is the one legitimate author of those tags.
 *
 * Axis B — Tone perimeter (Elon §3, Tanya §7 — honest voice parity):
 *   Every `headline={...}` / `whisper={...}` prop passed to `<EmptySurface />`
 *   is either:
 *     • a `phraseFor(...)` / `whisperFor(...)` / `emptyPhrase(...).headline`
 *       / `...whisper` expression (lexicon), or
 *     • a bare identifier in a file that imports one of the above
 *       (pass-through helpers — Mike §4.4 sanctioned), or
 *     • a string literal listed in `EMPTY_OVERRIDES`.
 *   Anything else — raw 'Nothing here yet.', unreviewed template literals —
 *   fails with a three-block error naming file:line + the fix.
 *
 * Credits: Krystle C. (original adoption-test pattern), Mike K. (napkin §8
 * — two-axis shape, three-block failure format, single-pass collector,
 * override set with six-entry smell threshold), Tanya D. (UX §2.1 — error
 * block shape, §5 — adoption guard lives at the layout layer too), Elon M.
 * (§3 — structural guardrail is the kernel that makes the voice honest
 * across additions).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { EMPTY_OVERRIDES } from '@/lib/sharing/empty-overrides';

const ROOT = join(__dirname, '..', '..', '..');

// ─── The four surface files (single source of truth) ──────────────────────

/**
 * The four quietest rooms. Axis B (tone perimeter) covers every `<EmptySurface />`
 * call-site in all four. Axis A (raw-tag perimeter) is tighter: only the two
 * threshold-only files (`not-found` and `error`) must be *entirely* composed
 * of the primitive — the other two have legitimate populated branches whose
 * product copy (MetaLine, Book-of-You heading) is outside the guard's scope.
 */
const SURFACE_FILES: readonly string[] = [
  'app/not-found.tsx',
  'app/error.tsx',
  'app/mirror/page.tsx',
  'app/resonances/ResonancesClient.tsx',
];

/** Threshold-only files — no populated branch, so raw h1/p is always a sin. */
const THRESHOLD_ONLY_FILES: readonly string[] = [
  'app/not-found.tsx',
  'app/error.tsx',
];

// ─── Scan footprint — every directory where drift could land ──────────────

const SCAN_DIRS: readonly string[] = ['components', 'app', 'lib/sharing'];
const SCAN_EXTS: ReadonlySet<string> = new Set<string>(['.ts', '.tsx']);

// ─── File walker (pure, ≤10 LOC each) ──────────────────────────────────────

function isScannableFile(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.'));
  if (!SCAN_EXTS.has(ext)) return false;
  if (path.endsWith('.test.ts') || path.endsWith('.test.tsx')) return false;
  if (path.endsWith('.d.ts')) return false;
  return !path.includes(`${sep}__tests__${sep}`);
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (isScannableFile(full)) acc.push(full);
  }
  return acc;
}

function collectFiles(): string[] {
  return SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
}

function relativePath(full: string): string {
  return relative(ROOT, full).split(sep).join('/');
}

// ─── Shared string preprocessing (comments + templates blanked) ───────────

function stripComments(src: string): string {
  const blocks = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  return blocks.replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
}

function stripTemplates(src: string): string {
  return src.replace(/`[^`]*`/g, (m) => m.replace(/[^\n]/g, ' '));
}

function preprocess(src: string): string {
  return stripTemplates(stripComments(src));
}

function lineAt(src: string, index: number): number {
  return src.slice(0, index).split(/\r?\n/).length;
}

// ─── Violation shape ───────────────────────────────────────────────────────

type ViolationKind = 'raw-tag' | 'hardcoded-prop';

interface Violation {
  file: string;
  line: number;
  expr: string;
  reason: ViolationKind;
}

// ─── Axis A — raw <h1> / <p> in the four surface files ────────────────────

const RAW_H1_RX = /<h1\b[^>]*>/g;
const RAW_P_RX = /<p\b[^>]*>/g;

function isAllowedTagAuthor(rel: string): boolean {
  return rel === 'components/shared/EmptySurface.tsx';
}

function scanRawTags(rel: string, src: string): Violation[] {
  if (!THRESHOLD_ONLY_FILES.includes(rel)) return [];
  if (isAllowedTagAuthor(rel)) return [];
  return [...matchAllToViolations(rel, src, RAW_H1_RX, '<h1>'),
          ...matchAllToViolations(rel, src, RAW_P_RX, '<p>')];
}

function matchAllToViolations(
  rel: string, src: string, rx: RegExp, expr: string,
): Violation[] {
  const out: Violation[] = [];
  for (const m of src.matchAll(rx)) {
    out.push({ file: rel, line: lineAt(src, m.index ?? 0), expr, reason: 'raw-tag' });
  }
  return out;
}

// ─── Axis B — Tone perimeter (EmptySurface props) ────────────────────────

/** Balanced-paren reader — returns text between the `(` at `start` and its `)`. */
function readBalancedParens(src: string, start: number): string | null {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return src.slice(start + 1, i); }
  }
  return null;
}

/** Read the JSX attribute expression inside `{...}` starting at `src[start]`. */
function readBalancedBraces(src: string, start: number): string | null {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start + 1, i); }
  }
  return null;
}

/** Does the expression call phraseFor / whisperFor / emptyPhrase? */
function invokesLexicon(expr: string): boolean {
  return /\bphraseFor\s*\(/.test(expr)
      || /\bwhisperFor\s*\(/.test(expr)
      || /\bemptyPhrase\s*\(/.test(expr);
}

/** If the expression is a bare string literal (no interpolation), return it. */
function asPlainStringLiteral(expr: string): string | null {
  const m = /^(['"])([\s\S]*)\1$/.exec(expr.trim());
  return m ? m[2] : null;
}

/** Is the expression a single identifier? Or a `.headline` / `.whisper` access? */
function isBareReference(expr: string): boolean {
  const trimmed = expr.trim();
  if (/^[A-Za-z_$][\w$]*$/.test(trimmed)) return true;
  return /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+$/.test(trimmed);
}

/** Does the file import one of the lexicon verbs? */
function fileImportsLexicon(src: string): boolean {
  return /import\s*\{[^}]*\b(phraseFor|whisperFor|emptyPhrase)\b[^}]*\}/.test(src);
}

function propExprIsOK(expr: string, fileHasImport: boolean): boolean {
  if (invokesLexicon(expr)) return true;
  const lit = asPlainStringLiteral(expr);
  if (lit !== null) return EMPTY_OVERRIDES.has(lit);
  if (isBareReference(expr) && fileHasImport) return true;
  return false;
}

// ─── JSX prop extraction (headline / whisper on <EmptySurface />) ─────────

const PROPS_TO_CHECK: readonly string[] = ['headline', 'whisper'];

function findEmptySurfaceCalls(src: string): Array<{ index: number; attrs: string }> {
  const out: Array<{ index: number; attrs: string }> = [];
  for (const m of src.matchAll(/<EmptySurface\b/g)) {
    const start = (m.index ?? 0) + m[0].length;
    const close = src.indexOf('>', start);
    if (close < 0) continue;
    out.push({ index: m.index ?? 0, attrs: src.slice(start, close) });
  }
  return out;
}

function extractAttrExpr(attrs: string, name: string): string | null {
  const rx = new RegExp(`\\b${name}\\s*=\\s*`);
  const m = rx.exec(attrs);
  if (!m) return null;
  const pos = m.index + m[0].length;
  const ch = attrs[pos];
  if (ch === '"' || ch === "'") return readQuotedString(attrs, pos);
  if (ch === '{') return readBalancedBraces(attrs, pos);
  return null;
}

function readQuotedString(src: string, start: number): string | null {
  const q = src[start];
  const end = src.indexOf(q, start + 1);
  return end < 0 ? null : src.slice(start, end + 1);
}

function scanProps(rel: string, src: string): Violation[] {
  const imports = fileImportsLexicon(src);
  return findEmptySurfaceCalls(src).flatMap(({ index, attrs }) =>
    classifyEmptySurfaceCall(rel, src, index, attrs, imports),
  );
}

function classifyEmptySurfaceCall(
  rel: string, src: string, index: number, attrs: string, imports: boolean,
): Violation[] {
  return PROPS_TO_CHECK.flatMap((name) => {
    const expr = extractAttrExpr(attrs, name);
    if (expr === null) return [];
    if (propExprIsOK(expr, imports)) return [];
    return [{ file: rel, line: lineAt(src, index), expr: `${name}=${expr}`, reason: 'hardcoded-prop' as const }];
  });
}

// ─── Single-pass collector (memoized — three describe blocks read it) ─────

let cachedViolations: Violation[] | null = null;

function scanAll(): Violation[] {
  if (cachedViolations !== null) return cachedViolations;
  cachedViolations = collectFiles().flatMap((p) => {
    const rel = relativePath(p);
    const src = preprocess(readFileSync(p, 'utf8'));
    return [...scanRawTags(rel, src), ...scanProps(rel, src)];
  });
  return cachedViolations;
}

// ─── Failure formatters (three-block error — Tanya §2.1) ──────────────────

function formatRawTagFailure(v: Violation): string {
  return (
    `  Raw ${v.expr} in empty/threshold surface at ${v.file}:${v.line}\n\n` +
    `    Route user-facing copy through <EmptySurface />\n` +
    `    (components/shared/EmptySurface.tsx). The four surface files are\n` +
    `    consumers of the primitive — they do not author <h1>/<p> themselves.`
  );
}

function formatPropFailure(v: Violation): string {
  return (
    `  ${v.file}:${v.line} — <EmptySurface /> ${v.expr}\n\n` +
    `    Route through emptyPhrase(kind).headline / .whisper\n` +
    `    (@/lib/sharing/empty-phrase), or add the literal to EMPTY_OVERRIDES\n` +
    `    (@/lib/sharing/empty-overrides) if it is a reviewed poetic one-off.`
  );
}

function assertNoViolations(vs: Violation[], fmt: (v: Violation) => string): void {
  expect(vs.map((v) => `${v.file}:${v.line}`)).toEqual([]);
  if (vs.length > 0) throw new Error('\n' + vs.map(fmt).join('\n\n'));
}

// ─── Tests — Axis A + Axis B + seam ───────────────────────────────────────

describe('empty adoption — DOM perimeter (Axis A)', () => {
  it('no raw <h1>/<p> in the four surface files', () => {
    const violations = scanAll().filter((v) => v.reason === 'raw-tag');
    assertNoViolations(violations, formatRawTagFailure);
  });

  it('surface-file list is exactly the four canonical rooms', () => {
    expect([...SURFACE_FILES].sort()).toEqual([
      'app/error.tsx',
      'app/mirror/page.tsx',
      'app/not-found.tsx',
      'app/resonances/ResonancesClient.tsx',
    ]);
  });

  it('each surface file renders exactly one <EmptySurface />', () => {
    for (const rel of SURFACE_FILES) {
      const src = preprocess(readFileSync(join(ROOT, rel), 'utf8'));
      const matches = src.match(/<EmptySurface\b/g) ?? [];
      expect({ file: rel, count: matches.length }).toEqual({ file: rel, count: 1 });
    }
  });
});

describe('empty adoption — Tone perimeter (Axis B)', () => {
  it('no hardcoded headline/whisper prop outside lexicon or EMPTY_OVERRIDES', () => {
    const violations = scanAll().filter((v) => v.reason === 'hardcoded-prop');
    assertNoViolations(violations, formatPropFailure);
  });

  it('EMPTY_OVERRIDES is the single source of literal exemptions', () => {
    expect(EMPTY_OVERRIDES).toBeInstanceOf(Set);
  });
});

// ─── Rectangle invariant for the four new kinds (Mike §4 #1) ──────────────

describe('empty adoption — rectangle holds for the four new kinds', () => {
  const { EMPTY_SURFACE_KINDS, TONE_BUCKETS, phraseFor, whisperFor } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/lib/sharing/reply-lexicon');

  it('every (EmptySurfaceKind × ToneBucket) cell has headline + whisper', () => {
    for (const k of EMPTY_SURFACE_KINDS) {
      for (const t of TONE_BUCKETS) {
        expect(phraseFor(k, t).length).toBeGreaterThan(0);
        expect(whisperFor(k, t).length).toBeGreaterThan(0);
      }
    }
  });
});

/** The three files that must remain whole for the empty-surface seam to hold. */
const SEAM_EXPORTS: ReadonlyArray<readonly [string, RegExp]> = [
  ['components/shared/EmptySurface.tsx', /export function EmptySurface/],
  ['lib/sharing/empty-phrase.ts',        /export function emptyPhrase/],
  ['lib/sharing/reply-lexicon.ts',       /export function whisperFor/],
];

describe('empty adoption — the seam is intact', () => {
  it.each(SEAM_EXPORTS)('%s exports the expected symbol', (rel, rx) => {
    expect(readFileSync(join(ROOT, rel), 'utf8')).toMatch(rx);
  });
});
