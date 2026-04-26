/**
 * _adoption-fence — stateless kernel shared by adoption-guard tests.
 *
 * Three nearly-identical fence files (`caption-metric-adoption`,
 * `numeric-features-adoption`, `filled-glyph-lift-adoption`) used to
 * carry their own copy of the same walker — `walk` + `stripComments` +
 * `lineIsExempt` + `relativePath`. The rule-of-three has fired
 * (precedents: `lib/design/hue.ts` commit `3ece6e7`,
 * `lib/design/hue-distance.ts` commit `08e4c7c`). One copy = one truth;
 * a `stripComments` JSX-edge-case fix in fence A no longer leaves
 * fences B and C silently disagreeing.
 *
 * **The kernel owns**: file walking, comment stripping, exempt-token
 * detection, per-pattern violation collection. **The kernel does NOT
 * own**: per-fence positive assertions (each canonical home has its
 * own shape — those stay per-fence per Elon #39 §2: *self-similar is
 * the seductive word that papers over genuine differences*).
 *
 * The two-pattern variant is the only non-trivial bit:
 * `numeric-features-adoption` carries two regex families with
 * separate allow-lists per pattern; the `patterns: FencePattern[]`
 * array carries `allow` per-pattern. The caption-metric co-occurrence
 * rule (`tabular-nums` AND `tracking-sys-caption` on the same line)
 * threads through the optional `co?: RegExp` — same engine, no
 * special-casing.
 *
 * Pure, no DOM, no Jest globals, no top-level side effects. Each
 * helper ≤ 10 LOC (matches `hue-distance.ts` tone). Underscore prefix
 * marks this as a private test helper, not a public ledger
 * (Mike #70 §A, Paul #55 §MH4 — *no ninth ledger*).
 *
 * Credits: Mike K. (architect napkin #48 — the kernel-lift spec, the
 * "polymorphism is a killer / one stateless kernel" call, the
 * `FencePattern.co` co-regex shape that retires the special-case in
 * caption-metric, the "kernel owns walker only / positive assertions
 * stay per-fence" boundary, the LOC budget); Elon M. (#39 — the
 * "ship-the-kernel-as-a-quiet-refactor" framing, the "verify by
 * identical violation strings" gate); Paul K. (#55 §MH1 — the felt
 * invariant business case, the *no ninth ledger* discipline that
 * keeps this module test-private); Krystle C. (rule-of-three doctrine);
 * the prior fences (`caption-metric-adoption.test.ts`,
 * `numeric-features-adoption.test.ts`,
 * `filled-glyph-lift-adoption.test.ts`) — most decisions paid for
 * already; this kernel is the lift, not the design.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');
const DEFAULT_EXTS: ReadonlySet<string> = new Set(['.ts', '.tsx']);

// ─── Public types ────────────────────────────────────────────────────────

/**
 * One pattern in a fence's grep-shape: a regex (the trigger), an allow
 * set (legal homes for THIS literal), and two optionals — `kind` to
 * label the violation, `co` to require a second regex on the same code
 * line (the caption-metric co-occurrence rule).
 */
export interface FencePattern {
  readonly regex: RegExp;
  readonly allow: ReadonlySet<string>;
  readonly kind?: string;
  readonly co?: RegExp;
}

/**
 * One fence declaration: scan footprint, exempt token, the patterns
 * that fire violations. `scanExts` defaults to `.ts` + `.tsx`.
 */
export interface FenceDecl {
  readonly scanDirs: readonly string[];
  readonly scanExts?: ReadonlySet<string>;
  readonly patterns: readonly FencePattern[];
  readonly exemptToken: string;
}

/** One source-line offence — `kind` is `undefined` for unlabelled fences. */
export interface Violation {
  readonly file: string;
  readonly line: number;
  readonly match: string;
  readonly kind?: string;
}

// ─── File walker (≤ 10 LOC each) ─────────────────────────────────────────

function isScannableFile(path: string, exts: ReadonlySet<string>): boolean {
  const ext = path.slice(path.lastIndexOf('.'));
  if (!exts.has(ext)) return false;
  if (path.endsWith('.test.ts') || path.endsWith('.test.tsx')) return false;
  if (path.endsWith('.d.ts')) return false;
  return !path.includes(`${sep}__tests__${sep}`);
}

function walk(dir: string, exts: ReadonlySet<string>, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, exts, acc);
    else if (isScannableFile(full, exts)) acc.push(full);
  }
  return acc;
}

function collectFiles(dirs: readonly string[], exts: ReadonlySet<string>): string[] {
  return dirs.flatMap((d) => walk(join(ROOT, d), exts));
}

function relativePath(full: string): string {
  return relative(ROOT, full).split(sep).join('/');
}

// ─── Comment-blind line normalizer (≤ 10 LOC each) ───────────────────────

/** Three passes — `{/* … *\/}` (JSX), `/* … *\/` (JS block), `// …` (line).
 * Replacement keeps newlines so source line numbers survive; comment text
 * becomes spaces so a tracked literal inside a doc-block cannot masquerade
 * as code. */
function stripComments(src: string): string {
  const blank = (m: string): string => m.replace(/[^\n]/g, ' ');
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/\/\/[^\n]*/g, blank);
}

function splitLines(src: string): string[] {
  return src.split(/\r?\n/);
}

/** True iff this line carries the inline exempt token, or is inside a
 * contiguous block opened by a comment carrying it. A blank line ends
 * the exemption — drift cannot sneak under a comment two paragraphs up. */
function lineIsExempt(ls: readonly string[], i: number, token: string): boolean {
  for (let j = i; j >= 0; j--) {
    if (ls[j].includes(token)) return true;
    if (j < i && ls[j].trim() === '') return false;
  }
  return false;
}

// ─── Per-pattern violation collector (≤ 10 LOC each) ─────────────────────

function lineMatchesPattern(line: string, p: FencePattern): boolean {
  if (!p.regex.test(line)) return false;
  return p.co ? p.co.test(line) : true;
}

function patternHit(
  rel: string,
  codeLine: string,
  originalLine: string,
  i: number,
  p: FencePattern,
): Violation | null {
  if (!lineMatchesPattern(codeLine, p)) return null;
  if (p.allow.has(rel)) return null;
  return { file: rel, line: i + 1, match: originalLine.trim(), kind: p.kind };
}

function scanLineAllPatterns(
  rel: string,
  codeLine: string,
  originalLine: string,
  i: number,
  patterns: readonly FencePattern[],
): Violation[] {
  const out: Violation[] = [];
  for (const p of patterns) {
    const hit = patternHit(rel, codeLine, originalLine, i, p);
    if (hit) out.push(hit);
  }
  return out;
}

function scanFile(full: string, decl: FenceDecl): Violation[] {
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

// ─── Public API ──────────────────────────────────────────────────────────

/** Run a fence declaration; return the violation list (in file → line order). */
export function runFence(decl: FenceDecl): Violation[] {
  const exts = decl.scanExts ?? DEFAULT_EXTS;
  return collectFiles(decl.scanDirs, exts).flatMap((p) => scanFile(p, decl));
}

/** Render a violation list as a Jest-readable failure block. The fix hint
 * trails each entry — failure-message-is-documentation (Mike #38 §4). */
export function formatViolations(
  violations: readonly Violation[],
  fixHint: string,
): string {
  return violations
    .map((v) => {
      const tag = v.kind ? ` [${v.kind}]` : '';
      return `  ${v.file}:${v.line}${tag} — ${v.match}\n${fixHint}`;
    })
    .join('\n');
}
