/**
 * clipboard-centrality — adoption guard for the clipboard seam.
 *
 * One assertion: `navigator.clipboard.writeText` has exactly ONE caller
 * in the scanned surface — `lib/sharing/clipboard-utils.ts`. Every other
 * component that wants to copy text routes through `copyToClipboard()`
 * or `copyWithFeedback()` and gets the envelope opt-in for free.
 *
 * The PNG path (`navigator.clipboard.write`) is OUT of scope — it owns
 * the Keepsake artifact and has its own invariants (Mike napkin §Out of
 * Scope). This guard does not extend to `.write`.
 *
 * One new caller = red build. One refactor drift = red build.
 *
 * Credits: Mike K. (napkin §Napkin Diagram adoption guard, §Points 9 +
 * the "one seam or no seam" rule), Tanya D. (§4b "one new pure-TS
 * module, no drift"), authors of the nine existing adoption guards —
 * this file is shape-isomorphic to `toast-adoption.test.ts`.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Single source of truth ────────────────────────────────────────────────

/** Files that legitimately call `navigator.clipboard.writeText`. */
const ALLOW: ReadonlySet<string> = new Set<string>([
  'lib/sharing/clipboard-utils.ts',
]);

/** Directories scanned for drift. */
const SCAN_DIRS: readonly string[] = [
  'components',
  'app',
  'lib/sharing',
  'lib/quote-cards',
  'lib/hooks',
  'lib/mirror',
];

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

// ─── Comment + template stripping (lifted from toast-adoption) ─────────────

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

// ─── Detector ──────────────────────────────────────────────────────────────

const WRITE_TEXT_RX = /navigator\.clipboard\.writeText/g;

interface Offender { file: string; line: number }

function lineAt(src: string, index: number): number {
  return src.slice(0, index).split(/\r?\n/).length;
}

function offendersIn(rel: string, src: string): Offender[] {
  const out: Offender[] = [];
  for (const m of src.matchAll(WRITE_TEXT_RX)) {
    out.push({ file: rel, line: lineAt(src, m.index ?? 0) });
  }
  return out;
}

function scanOne(full: string): Offender[] {
  const rel = relativePath(full);
  if (ALLOW.has(rel)) return [];
  return offendersIn(rel, preprocess(readFileSync(full, 'utf8')));
}

// ─── Jest suite ────────────────────────────────────────────────────────────

describe('clipboard-centrality — writeText has exactly one caller', () => {
  it('no file outside the allow-list calls navigator.clipboard.writeText', () => {
    const offenders = collectFiles().flatMap(scanOne);
    if (offenders.length === 0) return;
    const report = offenders
      .map(o => `  ${o.file}:${o.line}`)
      .join('\n');
    throw new Error(
      `\nclipboard-centrality drift — ${offenders.length} unauthorised caller(s):\n\n${report}\n\n` +
      `Fix: import { copyToClipboard } from '@/lib/sharing/clipboard-utils' instead.\n` +
      `Only lib/sharing/clipboard-utils.ts may call navigator.clipboard.writeText directly.\n`,
    );
  });

  it('the allow-listed file actually exists and still uses writeText', () => {
    const file = join(ROOT, 'lib/sharing/clipboard-utils.ts');
    const src = preprocess(readFileSync(file, 'utf8'));
    expect(src).toMatch(WRITE_TEXT_RX);
  });
});
