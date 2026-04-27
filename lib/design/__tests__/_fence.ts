/**
 * _fence — canonical walker kernel for source-string fence tests.
 *
 * Two prior kernels lived in two locations doing nearly-identical work:
 *
 *   • `lib/design/__tests__/_adoption-fence.ts`  (210 LOC) — line-pattern
 *     fences with per-pattern allow-lists + `co?:` co-occurrence regex
 *     + comment/exempt-token handling.
 *   • `components/shared/__tests__/_jsx-fence-walker.ts` (182 LOC) —
 *     JSX call-site fences: walk + comment+template strip + memoized
 *     preload + balanced-delimiter reader.
 *
 * Plus a third bespoke walker shipped inside
 * `motion-inline-style-fence.test.ts` (its own ~80 LOC `walk` /
 * `extractBalanced` / `styleBlocks` / `stripComments`). Three callers.
 * The rule-of-three has fired (Mike #41 §1) — *twice*. The fourth
 * caller shipping its own walker is the bug.
 *
 * This module is the lift, not the design. It keeps **two API surfaces
 * intentionally separate** (Mike #41 §8 risk-1, Elon #39 §2 — *self-
 * similar is the seductive word that papers over genuine differences*):
 *
 *   • `runLinePatterns(decl)` — for grep-shaped line fences (replaces
 *     `_adoption-fence`'s `runFence`). Comment-blind via a 3-pass strip.
 *   • `runJsxBlocks(decl)`    — for JSX `style={…}` / `attr={…}` block
 *     fences (lifts the third bespoke walker). Same comment strip;
 *     does NOT strip backtick templates so a `transition: \`…\`` shape
 *     inside a style object stays scannable.
 *
 * The JSX-call-site fences (`lean-arrow`, `voice-call-site`,
 * `alpha-call-site`, `divider`, `dismiss-verb`, `overlay-header`,
 * `gesture-call-site`, `label-swap-width`, `action-receipt`) drive the
 * tree directly via `preloadFiles()` + `readBalancedDelimiters()` +
 * `lineAt()` + `stripCommentsAndTemplates()` — those primitives stay
 * exported. `preloadFiles()` keeps the 4-pass strip (comments +
 * templates) so a JSX-element-shape regex cannot match a substring
 * baked into a doc-string template literal.
 *
 * Three strip strategies for three fence shapes; each preserves the
 * caller it was paid for. No caller loses a feature.
 *
 * Pure: no DOM, no Jest globals, no top-level side effects. Each
 * helper ≤ 10 LOC by construction. Underscore prefix marks this as a
 * private test helper, not a public ledger (Mike #70 §A — *no ninth
 * ledger*).
 *
 * Credits: Mike K. (#41 napkin — the "two API surfaces, one shared
 * walker" boundary, the LOC budget, the two-caller smoke-test cap),
 * Tanya D. (UIX #47 — the felt-experience appendix that names what
 * the fence guards; the "layers over layers" lens applied to test
 * infra), Elon M. (#39/#56 codas — the consolidation move named
 * first), Paul K. (#55/#87 — the *helper-as-line-item* discipline),
 * Krystle C. (rule-of-three doctrine, prior `inline-timing` pick),
 * Sid (the prior fences `_adoption-fence.ts` + `_jsx-fence-walker.ts`
 * — 80% of this kernel was paid for already; this is the lift).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

/** Default scan-extension set — `.ts` + `.tsx`. Mirror of the prior kernels. */
export const SCAN_EXTS: ReadonlySet<string> = new Set<string>(['.ts', '.tsx']);

// ─── Public types ─────────────────────────────────────────────────────────

/**
 * One line-pattern in a fence's grep-shape: a regex (the trigger), an
 * allow set (legal homes for THIS literal), an optional `kind` to label
 * the violation, and an optional `co` regex required on the same code
 * line (the caption-metric co-occurrence rule).
 */
export interface FencePattern {
  readonly regex: RegExp;
  readonly allow: ReadonlySet<string>;
  readonly kind?: string;
  readonly co?: RegExp;
}

/** One line-pattern fence declaration. */
export interface FenceDecl {
  readonly scanDirs: readonly string[];
  readonly scanExts?: ReadonlySet<string>;
  readonly patterns: readonly FencePattern[];
  readonly exemptToken: string;
}

/** One probe to apply to a captured JSX block payload. */
export interface JsxBlockProbe {
  readonly regex: RegExp;
  readonly kind: string;
}

/**
 * One JSX-block fence declaration. The `anchor` regex MUST match
 * through the opening delimiter (e.g. `/style\s*=\s*\{/g`); the kernel
 * reads the balanced body via `readBalancedDelimiters`. Each `probe`
 * fires one violation when its regex hits the captured body.
 */
export interface JsxBlockDecl {
  readonly scanDirs: readonly string[];
  readonly scanExts?: ReadonlySet<string>;
  readonly anchor: RegExp;
  readonly open: string;
  readonly close: string;
  readonly probes: readonly JsxBlockProbe[];
  readonly allow: ReadonlySet<string>;
}

/** One source-line offence — `kind` is `undefined` for unlabelled fences. */
export interface Violation {
  readonly file: string;
  readonly line: number;
  readonly match: string;
  readonly kind?: string;
}

/** One preloaded source file: relative path + comment+template-stripped src. */
export interface FilePreload { readonly rel: string; readonly src: string }

// ─── File walker ──────────────────────────────────────────────────────────

/** True iff this path is a scannable source file (not a test, type, or fixture). */
export function isScannableFile(path: string, exts: ReadonlySet<string> = SCAN_EXTS): boolean {
  const ext = path.slice(path.lastIndexOf('.'));
  if (!exts.has(ext)) return false;
  if (path.endsWith('.test.ts') || path.endsWith('.test.tsx')) return false;
  if (path.endsWith('.d.ts')) return false;
  return !path.includes(`${sep}__tests__${sep}`);
}

/** Recursive directory walk, accumulating scannable file paths. */
export function walk(dir: string, exts: ReadonlySet<string> = SCAN_EXTS, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, exts, acc);
    else if (isScannableFile(full, exts)) acc.push(full);
  }
  return acc;
}

/** Collect every scannable file under each `dirs[i]`, root-resolved. */
export function collectFiles(dirs: readonly string[], exts: ReadonlySet<string> = SCAN_EXTS): string[] {
  return dirs.flatMap((d) => walk(join(ROOT, d), exts));
}

/** Back-compat alias — JSX-call-site fences imported under this name. */
export function collectJsxFiles(scanDirs: readonly string[]): string[] {
  return collectFiles(scanDirs, SCAN_EXTS);
}

/** Project-root-relative path with `/` separators (stable across platforms). */
export function relativePath(full: string): string {
  return relative(ROOT, full).split(sep).join('/');
}

// ─── Comment / template stripping (line-number-preserving) ────────────────

/** Replace every char other than `\n` with a space — preserves line numbers. */
function blankNonNewline(m: string): string {
  return m.replace(/[^\n]/g, ' ');
}

/** Three-pass: `{/* … *\/}` (JSX), `/* … *\/` (JS block), `// …` (JS line). */
export function stripComments(src: string): string {
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, blankNonNewline)
    .replace(/\/\*[\s\S]*?\*\//g, blankNonNewline)
    .replace(/\/\/[^\n]*/g, blankNonNewline);
}

/** Blank backtick-template bodies so a doc-string literal cannot masquerade as code. */
function stripTemplates(src: string): string {
  return src.replace(/`[^`]*`/g, blankNonNewline);
}

/** Four-pass strip — comments + templates. Used by the JSX-call-site preload. */
export function stripCommentsAndTemplates(src: string): string {
  return stripTemplates(stripComments(src));
}

// ─── Line helpers ─────────────────────────────────────────────────────────

function splitLines(src: string): string[] {
  return src.split(/\r?\n/);
}

/** 1-based line number of `src[index]`. Pure. */
export function lineAt(src: string, index: number): number {
  return src.slice(0, index).split(/\r?\n/).length;
}

/**
 * True iff this line carries the inline exempt token, or sits inside a
 * contiguous block opened by a comment carrying it. A blank line ends
 * the exemption — drift cannot sneak under a comment two paragraphs up.
 */
export function lineIsExempt(ls: readonly string[], i: number, token: string): boolean {
  for (let j = i; j >= 0; j--) {
    if (ls[j].includes(token)) return true;
    if (j < i && ls[j].trim() === '') return false;
  }
  return false;
}

// ─── Balanced-delimiter reader (generalised over `{}`, `()`, `[]`) ────────

/**
 * Read the substring between matching `open` / `close` delimiters
 * anchored at `start` (which must point AT `open`). Returns
 * `{ body, end }` where `body = src.slice(start + 1, end)` and
 * `src[end] === close`. Returns `null` if EOS arrives before the
 * matching close — defensive, not load-bearing.
 */
export function readBalancedDelimiters(
  src: string, start: number, open: string, close: string,
): { body: string; end: number } | null {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === open) depth++;
    else if (src[i] === close) { depth--; if (depth === 0) return { body: src.slice(start + 1, i), end: i }; }
  }
  return null;
}

// ─── Memoized preload (one walk per scanDirs key, shared across describes)

const cacheByKey: Map<string, readonly FilePreload[]> = new Map();

function keyForDirs(scanDirs: readonly string[]): string {
  return [...scanDirs].sort().join('|');
}

function loadFile(full: string): FilePreload {
  return { rel: relativePath(full), src: stripCommentsAndTemplates(readFileSync(full, 'utf8')) };
}

/**
 * Read every scannable file under `scanDirs`, preprocess once, and
 * cache by sorted-scanDirs key so repeated calls (and multiple
 * `describe` blocks in one fence) share the read. Pay-on-first-use;
 * no top-level side effects.
 */
export function preloadFiles(scanDirs: readonly string[]): readonly FilePreload[] {
  const key = keyForDirs(scanDirs);
  const hit = cacheByKey.get(key);
  if (hit !== undefined) return hit;
  const files = collectJsxFiles(scanDirs).map(loadFile);
  cacheByKey.set(key, files);
  return files;
}

// ─── Line-pattern collector ───────────────────────────────────────────────

function lineMatchesPattern(line: string, p: FencePattern): boolean {
  if (!p.regex.test(line)) return false;
  return p.co ? p.co.test(line) : true;
}

function patternHit(
  rel: string, codeLine: string, originalLine: string, i: number, p: FencePattern,
): Violation | null {
  if (!lineMatchesPattern(codeLine, p)) return null;
  if (p.allow.has(rel)) return null;
  return { file: rel, line: i + 1, match: originalLine.trim(), kind: p.kind };
}

function scanLineAllPatterns(
  rel: string, codeLine: string, originalLine: string, i: number,
  patterns: readonly FencePattern[],
): Violation[] {
  const out: Violation[] = [];
  for (const p of patterns) {
    const hit = patternHit(rel, codeLine, originalLine, i, p);
    if (hit) out.push(hit);
  }
  return out;
}

function scanFileForLine(full: string, decl: FenceDecl): Violation[] {
  const rel = relativePath(full);
  const src = readFileSync(full, 'utf8');
  const original = splitLines(src);
  const code = splitLines(stripComments(src));
  const out: Violation[] = [];
  for (let i = 0; i < code.length; i++) {
    if (lineIsExempt(original, i, decl.exemptToken)) continue;
    out.push(...scanLineAllPatterns(rel, code[i], original[i], i, decl.patterns));
  }
  return out;
}

// ─── JSX-block collector ──────────────────────────────────────────────────

function ensureGlobalFlag(rx: RegExp): RegExp {
  return rx.flags.includes('g') ? rx : new RegExp(rx.source, rx.flags + 'g');
}

interface BlockHit { body: string; line: number }

function readOneBlock(
  stripped: string, m: RegExpExecArray, open: string, close: string,
): BlockHit | null {
  const openIdx = (m.index ?? 0) + m[0].length - 1;
  if (stripped[openIdx] !== open) return null;
  const r = readBalancedDelimiters(stripped, openIdx, open, close);
  return r === null ? null : { body: r.body, line: lineAt(stripped, m.index ?? 0) };
}

function findJsxBlocks(stripped: string, decl: JsxBlockDecl): BlockHit[] {
  const re = ensureGlobalFlag(decl.anchor);
  const out: BlockHit[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) !== null) {
    const hit = readOneBlock(stripped, m, decl.open, decl.close);
    if (hit !== null) out.push(hit);
  }
  return out;
}

function probeBlock(
  rel: string, hit: BlockHit, probes: readonly JsxBlockProbe[],
): Violation[] {
  return probes
    .filter((p) => p.regex.test(hit.body))
    .map((p) => ({ file: rel, line: hit.line, match: hit.body.trim(), kind: p.kind }));
}

function scanFileForJsxBlocks(full: string, decl: JsxBlockDecl): Violation[] {
  const rel = relativePath(full);
  if (decl.allow.has(rel)) return [];
  const stripped = stripComments(readFileSync(full, 'utf8'));
  return findJsxBlocks(stripped, decl).flatMap((h) => probeBlock(rel, h, decl.probes));
}

// ─── Public run + format API ──────────────────────────────────────────────

/** Run a line-pattern fence; return the violation list (file → line order). */
export function runLinePatterns(decl: FenceDecl): Violation[] {
  const exts = decl.scanExts ?? SCAN_EXTS;
  return collectFiles(decl.scanDirs, exts).flatMap((p) => scanFileForLine(p, decl));
}

/** Run a JSX-block fence; return the violation list (file → line order). */
export function runJsxBlocks(decl: JsxBlockDecl): Violation[] {
  const exts = decl.scanExts ?? SCAN_EXTS;
  return collectFiles(decl.scanDirs, exts).flatMap((p) => scanFileForJsxBlocks(p, decl));
}

/**
 * Render a violation list as a Jest-readable failure block. The fix
 * hint trails each entry — failure-message-is-documentation
 * (Mike #38 §4). Byte-identical to `_adoption-fence.ts.formatViolations`.
 */
export function formatViolations(violations: readonly Violation[], fixHint: string): string {
  return violations
    .map((v) => {
      const tag = v.kind ? ` [${v.kind}]` : '';
      return `  ${v.file}:${v.line}${tag} — ${v.match}\n${fixHint}`;
    })
    .join('\n');
}

/**
 * Three-block failure shape — `loc — summary` newline blank-line
 * `body`. Optional parity envelope for callers who want one shape
 * across multiple violation kinds. Byte-identical to
 * `_jsx-fence-walker.ts.formatBlock`.
 */
export function formatBlock(loc: string, summary: string, body: string): string {
  return `  ${loc} — ${summary}\n\n${body}`;
}
