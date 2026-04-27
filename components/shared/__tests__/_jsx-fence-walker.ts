/**
 * _jsx-fence-walker — pure transport primitives for JSX call-site fences.
 *
 * Three near-identical fences walk the JSX tree the same way today:
 *
 *   • `lean-arrow-fence`        (`components/shared/__tests__`)
 *   • `voice-call-site-fence`   (`lib/sharing/__tests__`)
 *   • `alpha-call-site-fence`   (`components/shared/__tests__` — lint #3)
 *
 * The duplicated bytes — file walker + comment/template stripper + line-at +
 * balanced-delimiter reader + memoized preload — total ~80 LoC × 3 ≈ 240 LoC
 * of byte-identical drift bait. A `stripComments` JSX-edge-case fix made in
 * fence A would silently leave fences B and C disagreeing. The rule-of-three
 * has fired (precedent: `lib/design/__tests__/_adoption-fence.ts` — same move
 * on the line-pattern adoption fences). Lift the transport into one place;
 * keep each fence's axes + bespoke prose where the eyes will read them.
 *
 * The kernel owns: walk + scan + strip + line-at + balanced-delim + preload.
 * The kernel does NOT own: per-fence axis logic, `formatXxx` prose. Each
 * fence keeps its own bespoke `formatMissingAnnounce`, `formatBadValue`, etc
 * — the seven existing prose bodies do not collapse onto one signature, and
 * forcing them through a `formatViolation({ ... })` kernel empirically
 * misfits 5 of 7 of them (Elon §4 / Mike #41 §"napkin diagram").
 *
 * Underscore prefix marks this as a private test helper, not a public ledger
 * (Mike #70 §A: *no ninth ledger*; matches `_adoption-fence.ts`, `_helpers.ts`).
 *
 * Pure, no DOM, no Jest globals, no top-level side effects (the preload memo
 * is pay-on-first-use). Each helper ≤ 10 LOC by construction.
 *
 * Credits: Mike K. (architect napkin #41 — kernel-lift spec, public surface,
 * "kernel owns transport / fences own axes / prose stays bespoke" boundary,
 * memoized-by-sorted-scanDirs preload shape, generalised
 * `readBalancedDelimiters` covering `{}` and `()` so a third variant cannot
 * grow), Elon M. (#44 — the "walker is the layer that drifts" first-
 * principles teardown that named this extraction), Krystle C. (#20 — named
 * lint #3 / `alpha-call-site-fence` and motivated the rule-of-three firing
 * here), Paul K. (#64 — kept us honest that this is plumbing protecting the
 * keepsake feature, not the feature; no doctrine added), Mike K. (#48 —
 * `_adoption-fence.ts` precedent — this is the same move, second time, in
 * the right neighborhood for the right family).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Scan footprint ───────────────────────────────────────────────────────

/** The two file extensions every JSX-fence cares about. */
export const SCAN_EXTS: ReadonlySet<string> = new Set<string>(['.ts', '.tsx']);

/** True iff this path is a scannable source file (not a test, type, or fixture). */
export function isScannableFile(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.'));
  if (!SCAN_EXTS.has(ext)) return false;
  if (path.endsWith('.test.ts') || path.endsWith('.test.tsx')) return false;
  if (path.endsWith('.d.ts')) return false;
  return !path.includes(`${sep}__tests__${sep}`);
}

/** Recursive directory walk, accumulating scannable file paths. */
export function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (isScannableFile(full)) acc.push(full);
  }
  return acc;
}

/** Collect every scannable file under each `scanDirs[i]`, root-resolved. */
export function collectJsxFiles(scanDirs: readonly string[]): string[] {
  return scanDirs.flatMap((d) => walk(join(ROOT, d)));
}

/** Project-root-relative path with `/` separators (stable across platforms). */
export function relativePath(full: string): string {
  return relative(ROOT, full).split(sep).join('/');
}

// ─── Comment / template stripping (so prose docs cannot trigger) ──────────

/** Replace every char other than `\n` with a space — preserves line numbers. */
function blankNonNewline(m: string): string {
  return m.replace(/[^\n]/g, ' ');
}

/** Two passes — `/* … *\/` (JS block) and `// …` (JS line). */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, blankNonNewline)
    .replace(/\/\/[^\n]*/g, blankNonNewline);
}

/** Blank backtick-template bodies so a doc-string literal cannot masquerade as code. */
function stripTemplates(src: string): string {
  return src.replace(/`[^`]*`/g, blankNonNewline);
}

/**
 * Remove comment text + template-literal text while preserving newlines and
 * char offsets. The result has identical line numbers as `src` so
 * `lineAt(stripped, idx)` and `lineAt(src, idx)` agree.
 */
export function stripCommentsAndTemplates(src: string): string {
  return stripTemplates(stripComments(src));
}

/** 1-based line number of `src[index]`. Pure. */
export function lineAt(src: string, index: number): number {
  return src.slice(0, index).split(/\r?\n/).length;
}

// ─── Balanced-delimiter reader (generalised over `{}`, `()`, `[]`) ────────

/**
 * Read the substring between matching `open` / `close` delimiters anchored
 * at `start` (which must point at `open`). Returns `{ body, end }` where
 * `body = src.slice(start + 1, end)` and `src[end] === close`. Returns
 * `null` if EOS arrives before the matching close — defensive, not load-
 * bearing. Generalised so `alpha-call-site-fence` can read `(args)` while
 * the JSX-tree fences keep reading `{ … }` blocks. ≤ 10 LOC.
 */
export function readBalancedDelimiters(
  src: string,
  start: number,
  open: string,
  close: string,
): { body: string; end: number } | null {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === open) depth++;
    else if (src[i] === close) { depth--; if (depth === 0) return { body: src.slice(start + 1, i), end: i }; }
  }
  return null;
}

// ─── Memoized preload (one walk per scanDirs key, shared across describes)

/** One preloaded source file: relative path + comment/template-stripped src. */
export interface FilePreload { readonly rel: string; readonly src: string }

const cacheByKey: Map<string, readonly FilePreload[]> = new Map();

function keyForDirs(scanDirs: readonly string[]): string {
  return [...scanDirs].sort().join('|');
}

function loadFile(full: string): FilePreload {
  return {
    rel: relativePath(full),
    src: stripCommentsAndTemplates(readFileSync(full, 'utf8')),
  };
}

/**
 * Read every scannable file under `scanDirs`, preprocess once, and cache by
 * sorted-scanDirs key so repeated calls (and multiple `describe` blocks in
 * one fence) share the read. Pure pay-on-first-use; no top-level side effects.
 */
export function preloadFiles(scanDirs: readonly string[]): readonly FilePreload[] {
  const key = keyForDirs(scanDirs);
  const hit = cacheByKey.get(key);
  if (hit !== undefined) return hit;
  const files = collectJsxFiles(scanDirs).map(loadFile);
  cacheByKey.set(key, files);
  return files;
}

// ─── Optional failure-block formatter (parity envelope) ────────────────────

/**
 * Three-block failure shape — `loc — summary` newline blank-line `body`.
 * Optional. Each fence may keep its bespoke per-violation prose; this is
 * the parity envelope for callers who want one shape across multiple
 * violation kinds. NO `doctrine:` field. NO ceremony. ≤ 5 LOC.
 */
export function formatBlock(loc: string, summary: string, body: string): string {
  return `  ${loc} — ${summary}\n\n${body}`;
}
