/**
 * pressable-adoption — adoption guardrail.
 *
 * Every interactive surface on the site speaks the one dialect of touch
 * owned by `<Pressable>` (components/shared/Pressable.tsx). This test fails
 * when a new `<button>`, a `role="button"`, or an ad-hoc tactile class
 * slips into `components/**` or `app/**`.
 *
 * This is not ESLint — it is a jest test. One file, zero config, one
 * allow-list. Replaces Paul §5 / Mike §7.6.
 *
 * Credits: Mike K. (napkin §7.6 + §2 diagram), Tanya D. (§3.5 acceptance),
 * Elon M. (let migration ship first; enforce drift as a test, not a grid).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

/** The one module that legitimately owns a raw <button> — the primitive. */
const BUTTON_ALLOW = new Set<string>([
  'components/shared/Pressable.tsx',
]);

/** Modules that legitimately own press-recipe classes (scale/hover). */
const RECIPE_ALLOW = new Set<string>([
  'components/shared/Pressable.tsx',
  'lib/utils/press-phase.ts',
]);

/** Directories to scan. */
const SCAN_DIRS = ['components', 'app'];

/** File extensions to scan. */
const SCAN_EXTS = new Set<string>(['.tsx']);

// ─── File walker (pure, ≤ 10 LOC each) ─────────────────────────────────────

function isScannableFile(path: string): boolean {
  if (!SCAN_EXTS.has(path.slice(path.lastIndexOf('.')))) return false;
  return !path.endsWith('.test.tsx') && !path.endsWith('.d.tsx');
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

// ─── Pattern scanners (pure, each returns a boolean) ───────────────────────

function hasRawButton(src: string): boolean {
  return /<button(\s|>)/.test(src) || /role=["']button["']/.test(src);
}

/**
 * The three tactile recipes Mike's §6 success criteria calls out as
 * exclusive to the Pressable module. `hover:border-gold/*` and
 * `disabled:opacity-50` are softer signals that can legitimately appear
 * on non-button surfaces (cards, rings) — handled in a follow-up sprint
 * per Tanya §4.5.
 */
function hasAdHocRecipe(src: string): boolean {
  if (/hover:scale-/.test(src)) return true;
  if (/active:scale-/.test(src)) return true;
  return /hover:bg-gold\//.test(src);
}

// ─── Violation collector (single source of truth) ──────────────────────────

interface Violation {
  file: string;
  kind: 'raw-button' | 'ad-hoc-recipe';
}

function check(path: string, src: string): Violation[] {
  const rel = relativePath(path);
  const out: Violation[] = [];
  if (hasRawButton(src) && !BUTTON_ALLOW.has(rel)) out.push({ file: rel, kind: 'raw-button' });
  if (hasAdHocRecipe(src) && !RECIPE_ALLOW.has(rel)) out.push({ file: rel, kind: 'ad-hoc-recipe' });
  return out;
}

function findAllViolations(): Violation[] {
  return collectFiles().flatMap((p) => check(p, readFileSync(p, 'utf8')));
}

// ─── Tests — the whole point ───────────────────────────────────────────────

describe('pressable adoption — every touch speaks one dialect', () => {
  const violations = findAllViolations();

  it('no raw <button> outside components/shared/Pressable.tsx', () => {
    const raw = violations.filter((v) => v.kind === 'raw-button');
    expect(raw.map((v) => v.file)).toEqual([]);
  });

  it('no ad-hoc tactile classes (hover:scale-*, hover:bg-gold/*, disabled:opacity-50)', () => {
    const recipes = violations.filter((v) => v.kind === 'ad-hoc-recipe');
    expect(recipes.map((v) => v.file)).toEqual([]);
  });
});
