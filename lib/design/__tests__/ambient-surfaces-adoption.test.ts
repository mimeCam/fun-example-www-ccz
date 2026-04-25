/**
 * ambient-surfaces-adoption — guardrail for the Reciprocal Chrome module.
 *
 * Every gesture-chrome surface (::selection, scrollbar-*, caret-color,
 * ::placeholder, ::marker) belongs to exactly one file:
 * `lib/design/ambient-surfaces.css`. This test fails when a stray rule
 * slips back into app/**, components/**, or lib/**.
 *
 * This is not ESLint — it is a jest scan with one allow-list. Mirrors
 * the shape of `pressable-adoption.test.ts`, `field-adoption.test.ts`,
 * `textlink-adoption.test.ts`. Without it, someone adds a raw
 * `::-webkit-scrollbar` in `components/mirror/` next sprint and the
 * discipline collapses (Mike §5 P4).
 *
 * Credits: Mike K. (napkin §5 — adoption-guard idiom), Elon M.
 * (guard-as-test, not guard-as-prose), Tanya D. (§10 — "stay robust
 * without a policing human"), Krystle C. (original adoption gate).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

/** The one module that legitimately owns gesture-chrome rules. */
const MODULE_ALLOW = new Set<string>([
  'lib/design/ambient-surfaces.css',
]);

/** Directories to scan. Mirrors Mike §5 P4 — full surface coverage. */
const SCAN_DIRS = ['app', 'components', 'lib'];

/** File extensions to scan. CSS + source files (catches Tailwind brackets). */
const SCAN_EXTS = new Set<string>(['.css', '.ts', '.tsx']);

/** Test files don't ship — they may legitimately reference forbidden names. */
function isTestFile(path: string): boolean {
  return path.endsWith('.test.ts')
      || path.endsWith('.test.tsx')
      || path.includes(`${sep}__tests__${sep}`);
}

// ─── File walker (pure, ≤ 10 LOC each) ─────────────────────────────────────

function isScannableFile(path: string): boolean {
  if (!SCAN_EXTS.has(path.slice(path.lastIndexOf('.')))) return false;
  if (isTestFile(path)) return false;
  return !path.endsWith('.d.ts');
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
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

// ─── Comment stripper ──────────────────────────────────────────────────────
//
// Comments legitimately reference the forbidden names as documentation
// (pointers to ambient-surfaces.css). Running the scanner over
// comment-free source lets us keep the docs honest and the guard strict.

function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments (CSS + JS)
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1'); // line comments (JS); leaves URLs
}

// ─── Pattern scanners (pure, each returns a boolean) ───────────────────────
//
// Each name maps to exactly one regex. Ordering: ::selection variants first
// (the receipt), then scrollbar (chorus), then caret/placeholder/marker.

function hasSelectionPseudo(src: string): boolean {
  return /::selection(\b|[^-])/.test(src) || /::-moz-selection\b/.test(src);
}

function hasScrollbarPseudo(src: string): boolean {
  return /::-webkit-scrollbar(\b|-)/.test(src);
}

function hasScrollbarColor(src: string): boolean {
  return /\bscrollbar-color\s*:/.test(src);
}

function hasScrollbarGutter(src: string): boolean {
  return /\bscrollbar-gutter\s*:/.test(src);
}

function hasCaretColor(src: string): boolean {
  // Matches bare `caret-color:` declarations, including Tailwind-bracket
  // utilities like `[caret-color:var(--token-accent)]`.
  return /\bcaret-color\s*:/.test(src);
}

function hasPlaceholderPseudo(src: string): boolean {
  return /::placeholder\b/.test(src);
}

function hasMarkerPseudo(src: string): boolean {
  return /::marker\b/.test(src);
}

// ─── Violation collector (single source of truth) ──────────────────────────

type Kind =
  | 'selection' | 'scrollbar-pseudo' | 'scrollbar-color' | 'scrollbar-gutter'
  | 'caret-color' | 'placeholder' | 'marker';

interface Violation { file: string; kind: Kind }

function checkOne(rel: string, hit: boolean, kind: Kind): Violation[] {
  return hit && !MODULE_ALLOW.has(rel) ? [{ file: rel, kind }] : [];
}

function check(path: string, raw: string): Violation[] {
  const rel = relativePath(path);
  const src = stripComments(raw);
  return [
    ...checkOne(rel, hasSelectionPseudo(src), 'selection'),
    ...checkOne(rel, hasScrollbarPseudo(src), 'scrollbar-pseudo'),
    ...checkOne(rel, hasScrollbarColor(src), 'scrollbar-color'),
    ...checkOne(rel, hasScrollbarGutter(src), 'scrollbar-gutter'),
    ...checkOne(rel, hasCaretColor(src), 'caret-color'),
    ...checkOne(rel, hasPlaceholderPseudo(src), 'placeholder'),
    ...checkOne(rel, hasMarkerPseudo(src), 'marker'),
  ];
}

function findAllViolations(): Violation[] {
  return collectFiles().flatMap((p) => check(p, readFileSync(p, 'utf8')));
}

// ─── Tests — one per surface, each asserting an empty violation list ──────

describe('ambient-surfaces adoption — one file owns gesture-chrome', () => {
  const violations = findAllViolations();

  it('no ::selection / ::-moz-selection outside ambient-surfaces.css', () => {
    expect(violations.filter((v) => v.kind === 'selection').map((v) => v.file))
      .toEqual([]);
  });

  it('no ::-webkit-scrollbar* outside ambient-surfaces.css', () => {
    expect(violations.filter((v) => v.kind === 'scrollbar-pseudo').map((v) => v.file))
      .toEqual([]);
  });

  it('no `scrollbar-color:` outside ambient-surfaces.css', () => {
    expect(violations.filter((v) => v.kind === 'scrollbar-color').map((v) => v.file))
      .toEqual([]);
  });

  it('no `scrollbar-gutter:` outside ambient-surfaces.css', () => {
    expect(violations.filter((v) => v.kind === 'scrollbar-gutter').map((v) => v.file))
      .toEqual([]);
  });

  it('no `caret-color:` outside ambient-surfaces.css (inherits from :root)', () => {
    expect(violations.filter((v) => v.kind === 'caret-color').map((v) => v.file))
      .toEqual([]);
  });

  it('no ::placeholder outside ambient-surfaces.css', () => {
    expect(violations.filter((v) => v.kind === 'placeholder').map((v) => v.file))
      .toEqual([]);
  });

  it('no ::marker outside ambient-surfaces.css', () => {
    expect(violations.filter((v) => v.kind === 'marker').map((v) => v.file))
      .toEqual([]);
  });
});
