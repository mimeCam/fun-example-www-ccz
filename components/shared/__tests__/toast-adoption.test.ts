/**
 * toast-adoption — the 6th adoption guard (DOM + tone).
 *
 * Two describe blocks, one seam: the toast-store pub/sub singleton that
 * owns the blog's single voice of acknowledgment. This file IS the fence
 * that keeps the primitive load-bearing — shipped so day-365 drift cannot
 * re-open the door silently.
 *
 * Axis A — DOM perimeter (the 6th adoption guard, shape-identical to the
 * other five adoption families):
 *   No foreign-DOM toast mount outside the three legitimate authors
 *   (`Toast`, `ToastHost`, `toast-store`). Detection: a
 *   `document.createElement('div')` combined with a `.style.cssText = ...`
 *   whose value carries a toast-pill signature (`position:fixed`,
 *   `box-shadow`, `border-radius`, or `bottom:`). Filters out unrelated
 *   foreign-DOM sentinels — `useScrollDepth`'s 1-px `position:absolute`
 *   div is not toast-shaped and does not trip the guard.
 *
 * Axis B — Tone perimeter (Elon §4, Tanya §3 — the honest companion that
 * makes the AGENTS.md positioning line factually true):
 *   Every `toastShow({ message: ... })` argument is either:
 *     • a `replyPhrase(...)` / `phraseFor(...)` invocation (lexicon), or
 *     • a bare identifier in a file that imports one of the above (the
 *       heuristic Mike §4.4 sanctions for pass-through helpers), or
 *     • a string literal listed in `POETIC_OVERRIDES` (reviewed
 *       line-by-line in `@/lib/sharing/poetic-overrides`).
 *   Anything else — raw 'Copied!', unreviewed template literals — fails
 *   with a three-block error naming file:line + the fix.
 *
 * The primitive's pair rule (AGENTS.md) is honored — no 9th ledger, no
 * 7th primitive, no new animation. One guard, two assertions, shipped
 * together so the marker is true the moment it lands.
 *
 * Credits: Mike K. (napkin §1–§11 — the two-assertion design, the scan
 * footprint, the ~30-LOC support module, the failure-message shape,
 * the six-entry smell threshold), Tanya D. (UX §2.1 three-block error
 * format, §2.2 explicit refusal of prose prompts dressed as polish,
 * §3 Axis A + Axis B separation, §4 Option A honest positioning),
 * Elon M. (§4 salvage move — the tone scanner is what makes the marker
 * factually true, not rhetoric), Paul K. (the "one mouth, forever"
 * framing + the "diff-fits-on-a-napkin" acceptance test), Krystle C.
 * (original sprint mechanics + allow-list shape + footprint scope).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { POETIC_OVERRIDES } from '@/lib/sharing/poetic-overrides';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Allow-lists (single source of truth) ──────────────────────────────────

/** Files that legitimately hand-wire a toast-shaped foreign-DOM mount. */
const DOM_ALLOW: ReadonlySet<string> = new Set<string>([
  'components/shared/Toast.tsx',
  'components/shared/ToastHost.tsx',
  'lib/sharing/toast-store.ts',
]);

/** Scan footprint — every directory where future drift could land. */
const SCAN_DIRS: readonly string[] = [
  'components',
  'app',
  'lib/sharing',
  'lib/quote-cards',
  'lib/hooks',
];

/** Extensions to scan. TSX + TS; tests excluded by `isScannableFile`. */
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

// ─── Violation shape (single source of truth) ──────────────────────────────

type ViolationKind = 'bespoke-dom' | 'hardcoded-message';

interface Violation {
  file: string;
  line: number;
  expr: string;
  reason: ViolationKind;
}

function lineAt(src: string, index: number): number {
  return src.slice(0, index).split(/\r?\n/).length;
}

/**
 * Erase comment bodies while preserving newlines and total length. Keeps
 * `file:line` reports accurate and stops docstring examples (e.g. the
 * `toastShow({ message: ... })` mentions in this guard's sibling files)
 * from being read as real call-sites.
 */
function stripComments(src: string): string {
  const blocks = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  return blocks.replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
}

/**
 * Blank out every template-literal body (backtick-delimited, possibly
 * containing `${...}`) so docstring-like examples embedded in code strings
 * do not register as real `toastShow(` call-sites. Plain single/double
 * quoted strings stay intact — the tone scanner needs to inspect them
 * when they appear as a `message:` value.
 */
function stripTemplates(src: string): string {
  return src.replace(/`[^`]*`/g, (m) => m.replace(/[^\n]/g, ' '));
}

function preprocess(src: string): string {
  return stripTemplates(stripComments(src));
}

// ─── Axis A — DOM perimeter scanner ────────────────────────────────────────

const CREATE_DIV_RX = /document\.createElement\(\s*['"`]div['"`]\s*\)/;
const CSSTEXT_RX = /\.style\.cssText\s*=\s*(['"`])([^'"`]*)\1/g;
const PILL_SIG_RX = /position\s*:\s*fixed|box-shadow|border-radius|bottom\s*:/;

function hasToastPillCssText(src: string): boolean {
  for (const m of src.matchAll(CSSTEXT_RX)) {
    if (PILL_SIG_RX.test(m[2])) return true;
  }
  return false;
}

function hasForeignToastMount(src: string): boolean {
  if (!CREATE_DIV_RX.test(src)) return false;
  return hasToastPillCssText(src);
}

function scanDom(rel: string, src: string): Violation[] {
  if (DOM_ALLOW.has(rel)) return [];
  if (!hasForeignToastMount(src)) return [];
  const m = CREATE_DIV_RX.exec(src);
  const line = m ? lineAt(src, m.index) : 1;
  return [{ file: rel, line, expr: "document.createElement('div') + cssText pill", reason: 'bespoke-dom' }];
}

// ─── Axis B — Tone perimeter scanner ───────────────────────────────────────

/**
 * Balanced-paren reader. Returns the text BETWEEN the paren pair that
 * starts at `src[start]` (which must be `(`). Returns `null` if parens
 * don't balance — a malformed source jest will flag downstream anyway.
 */
function readBalancedParens(src: string, start: number): string | null {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return src.slice(start + 1, i); }
  }
  return null;
}

/**
 * Read a single expression starting at `src[start]`, stopping at a `,` or
 * closing `}` / `)` / `]` at top-level depth. Used to extract the value
 * expression of a `message:` field from an object-literal argument.
 */
function readExprUntilDelimiter(src: string, start: number): string {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (depth === 0 && /[,)\]}]/.test(c)) return src.slice(start, i).trim();
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
  }
  return src.slice(start).trim();
}

/** Extract the `message:` value expression from an object-literal arg string. */
function extractMessageExpr(arg: string): string | null {
  const rx = /\bmessage\s*:\s*/;
  const m = rx.exec(arg);
  if (!m) return null;
  const start = m.index + m[0].length;
  return readExprUntilDelimiter(arg, start);
}

/** If the expression is a bare string literal (no interpolation), return the value. */
function asPlainStringLiteral(expr: string): string | null {
  const m = /^(['"`])([\s\S]*)\1$/.exec(expr);
  if (!m) return null;
  if (m[1] === '`' && expr.includes('${')) return null;
  return m[2];
}

/** Does the expression call `replyPhrase(` or `phraseFor(` anywhere? */
function invokesLexicon(expr: string): boolean {
  return /\breplyPhrase\s*\(/.test(expr) || /\bphraseFor\s*\(/.test(expr);
}

/** Is the expression a single identifier (e.g. a parameter name)? */
function isBareIdentifier(expr: string): boolean {
  return /^[A-Za-z_$][\w$]*$/.test(expr);
}

/** Does the file import `replyPhrase` / `phraseFor` from the lexicon seam? */
function fileImportsLexicon(src: string): boolean {
  const rx = /import\s*\{[^}]*\b(replyPhrase|phraseFor)\b[^}]*\}\s*from\s*['"]@\/lib\/sharing\/(reply-resolve|reply-lexicon)['"]/;
  return rx.test(src);
}

/** Classify the message expression as acceptable or not. Pure. */
function toneExprIsOK(expr: string, fileHasLexiconImport: boolean): boolean {
  if (invokesLexicon(expr)) return true;
  const lit = asPlainStringLiteral(expr);
  if (lit !== null) return POETIC_OVERRIDES.has(lit);
  if (isBareIdentifier(expr) && fileHasLexiconImport) return true;
  return false;
}

/** Collect every `toastShow(...)` call as {index, arg-text} tuples. */
function findToastShowCalls(src: string): Array<{ index: number; arg: string }> {
  const out: Array<{ index: number; arg: string }> = [];
  for (const m of src.matchAll(/\btoastShow\s*\(/g)) {
    const index = m.index ?? 0;
    const arg = readBalancedParens(src, index + m[0].length - 1);
    if (arg !== null) out.push({ index, arg });
  }
  return out;
}

function scanTone(rel: string, src: string): Violation[] {
  if (rel === 'lib/sharing/toast-store.ts') return [];
  const imports = fileImportsLexicon(src);
  return findToastShowCalls(src).flatMap(({ index, arg }) =>
    classifyCall(rel, src, index, arg, imports),
  );
}

function classifyCall(rel: string, src: string, index: number, arg: string, imports: boolean): Violation[] {
  const expr = extractMessageExpr(arg);
  if (expr === null) return [];
  if (toneExprIsOK(expr, imports)) return [];
  return [{ file: rel, line: lineAt(src, index), expr, reason: 'hardcoded-message' }];
}

// ─── Single-pass collector (memoized — two describe blocks read it) ───────

let cachedViolations: Violation[] | null = null;

function scanAll(): Violation[] {
  if (cachedViolations !== null) return cachedViolations;
  cachedViolations = collectFiles().flatMap((p) => {
    const rel = relativePath(p);
    const src = preprocess(readFileSync(p, 'utf8'));
    return [...scanDom(rel, src), ...scanTone(rel, src)];
  });
  return cachedViolations;
}

// ─── Failure formatters (three-block error — Tanya §2.1) ───────────────────

function formatDomFailure(v: Violation): string {
  return (
    `  Bespoke acknowledgment found at ${v.file}:${v.line}\n\n` +
    `    Route through toastShow / useToast (@/lib/sharing/toast-store).\n` +
    `    Primitive: components/shared/Toast.tsx. Host: components/shared/ToastHost.tsx.`
  );
}

function formatToneFailure(v: Violation): string {
  return (
    `  ${v.file}:${v.line} — toastShow message: ${v.expr}\n\n` +
    `    Route through replyPhrase(kind) from @/lib/sharing/reply-resolve,\n` +
    `    or add the literal to POETIC_OVERRIDES (@/lib/sharing/poetic-overrides) if intentional.`
  );
}

function assertNoViolations(vs: Violation[], fmt: (v: Violation) => string): void {
  expect(vs.map((v) => `${v.file}:${v.line}`)).toEqual([]);
  if (vs.length > 0) throw new Error('\n' + vs.map(fmt).join('\n\n'));
}

// ─── Tests — Axis A + Axis B, one file, one seam ───────────────────────────

describe('toast adoption — DOM perimeter (Axis A)', () => {
  const violations = scanAll().filter((v) => v.reason === 'bespoke-dom');

  it('no foreign-DOM toast mounts outside the three allow-listed authors', () => {
    assertNoViolations(violations, formatDomFailure);
  });

  it('DOM allow-list is exactly the three canonical authors', () => {
    expect(Array.from(DOM_ALLOW).sort()).toEqual([
      'components/shared/Toast.tsx',
      'components/shared/ToastHost.tsx',
      'lib/sharing/toast-store.ts',
    ]);
  });

  it('ThermalLayout mounts <ToastHost /> exactly once', () => {
    const src = readFileSync(join(ROOT, 'components/thermal/ThermalLayout.tsx'), 'utf8');
    const matches = src.match(/<ToastHost\s*\/>/g) ?? [];
    expect(matches.length).toBe(1);
  });
});

describe('toast adoption — Tone perimeter (Axis B)', () => {
  const violations = scanAll().filter((v) => v.reason === 'hardcoded-message');

  it('no hardcoded toastShow message outside lexicon or POETIC_OVERRIDES', () => {
    assertNoViolations(violations, formatToneFailure);
  });

  it('POETIC_OVERRIDES is the single source of literal exemptions', () => {
    expect(POETIC_OVERRIDES).toBeInstanceOf(Set);
    expect(POETIC_OVERRIDES.size).toBeGreaterThan(0);
  });
});

/** The four files that must remain whole for the seam to hold. */
const SEAM_EXPORTS: ReadonlyArray<readonly [string, RegExp]> = [
  ['components/shared/Toast.tsx',     /export function Toast/],
  ['components/shared/ToastHost.tsx', /export function ToastHost/],
  ['lib/sharing/toast-store.ts',      /export function toastShow/],
  ['lib/sharing/reply-resolve.ts',    /export function replyPhrase/],
];

describe('toast adoption — the seam is intact', () => {
  it.each(SEAM_EXPORTS)('%s exports the expected symbol', (rel, rx) => {
    expect(readFileSync(join(ROOT, rel), 'utf8')).toMatch(rx);
  });
});
