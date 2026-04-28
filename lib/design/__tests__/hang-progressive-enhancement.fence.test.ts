/**
 * Hang Progressive-Enhancement — the honesty fence.
 *
 * The literal `hanging-punctuation` paints on Safari only (~30–35% of
 * traffic). Chrome / Firefox / Edge silently no-op the declaration.
 * That asymmetry is the load-bearing receipt — *Safari-only paint is the
 * receipt, not the bug.* This fence pins the literal to its two legal
 * homes so a future PR cannot quietly bury a JS canvas-shim, an inline
 * style, or a stray Tailwind arbitrary-value variant in a third place.
 *
 * Two homes (and only two):
 *
 *   1. `app/globals.css` — the canonical CSS rule on `.typo-hang-passage`.
 *   2. `lib/design/typography.ts` — the docblock + `HANGING_PUNCTUATION`
 *      load-bearing literal that mirrors the CSS rule. The
 *      `typography-sync.test.ts` byte-pins the two against each other.
 *
 * Anywhere else the literal `hanging-punctuation` appears in the repo,
 * the fence reds and names the drift. Markdown receipts under
 * `__tests__/screenshots/` are documentation, not call-site code, and
 * are explicitly allow-listed below — they describe the felt difference,
 * they do not paint it.
 *
 * Why a separate fence (not folded into `passage-hang-converges`):
 * carrier-side convergence (the three body-prose surfaces) and
 * literal-side honesty (the two-home invariant on the CSS property
 * itself) are different invariants. A single fence that asserted both
 * would mix the carrier list with the file allow-list — a future PR
 * adding a fourth carrier would have to edit assertions about CSS
 * homes, and vice versa. Two fences = two reds, two reviewers, zero
 * coupling. (Mike napkin §4 — "the honesty receipt lives in
 * `hang-progressive-enhancement.fence.test.ts`, NOT in cosmology
 * around the Golden Thread.")
 *
 * Pure-source assertion — does NOT spin up React. Reads files from disk
 * and checks set membership of the property literal.
 *
 * Credits: Mike Koch (architect napkin §4 — the explicit two-fence split,
 * the file allow-list as a literal taxonomy not a metaphor, the refusal
 * to fold honesty into convergence), Tanya Donska (UX §3.1 — the felt-
 * deliverable framing of progressive enhancement; the "we do not chase
 * Chrome parity" hard line that this fence enforces in code), Elon Musk
 * (the browser-coverage asymmetry teardown that made progressive
 * enhancement the explicit deliverable; the *"99% never name, 100%
 * feel"* honesty that the docblock voice adopts), Krystle Clear (VP
 * Product brief — the receipt-as-screenshot framing that the screenshot
 * markdown allow-list mirrors), Sid (≤ 10 LoC per helper, no-renderer
 * fence pattern, file-walk lifted from sibling honesty fences).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

// ─── The two legal homes of the literal `hanging-punctuation` ──────────────
//
// Repo-relative paths. If a future PR adds a third home, it MUST land in
// this list with a one-line rationale in the docblock above — the test
// fail message names the new file so the reviewer cannot miss it.

const ALLOWED_HOMES: ReadonlyArray<string> = [
  'app/globals.css',
  'lib/design/typography.ts',
] as const;

// Markdown receipts (and other documentation surfaces) are allowed to
// mention the literal — they describe the felt difference; they do not
// paint it. Allow-list by directory prefix so screenshot receipts and
// fence tests can proliferate without ledger churn.
const DOC_PREFIXES: ReadonlyArray<string> = [
  '__tests__/screenshots/',
  '_reports/',
  '_my/',
  'AGENTS.md',
  // Test files reference the literal as the subject under test; they
  // document the contract, they do not paint it. Trapping them here
  // would fold tests-into-targets, conflating two reviewer audiences.
  'lib/design/__tests__/',
  '__tests__/',
] as const;

// Directories the walker SKIPS — build artefacts, vendor code, VCS.
const SKIP_DIRS: ReadonlyArray<string> = [
  'node_modules', '.next', '.git', 'logs', 'gh', 'public', 'openloop',
] as const;

// File extensions worth reading. CSS, TS, TSX, JS, JSX, MD only —
// everything else (binary, lockfile, config blobs) cannot host the
// literal in a way the fence cares about.
const READ_EXTS: ReadonlyArray<string> = [
  '.ts', '.tsx', '.js', '.jsx', '.css', '.md', '.mdx',
] as const;

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/** True iff a repo-relative path is documentation, not call-site code. */
function isDoc(rel: string): boolean {
  return DOC_PREFIXES.some((p) => rel === p || rel.startsWith(p));
}

/** True iff a repo-relative path is one of the two canonical homes. */
function isAllowedHome(rel: string): boolean {
  return ALLOWED_HOMES.includes(rel);
}

/** True iff a directory entry should be walked into. */
function isWalkable(name: string): boolean {
  return !SKIP_DIRS.includes(name) && !name.startsWith('.');
}

/** True iff a file extension is worth reading for the literal. */
function isReadable(name: string): boolean {
  return READ_EXTS.some((ext) => name.endsWith(ext));
}

/** True iff a file's contents contain `hanging-punctuation` as a property. */
function fileHasLiteral(absPath: string): boolean {
  return readFileSync(absPath, 'utf8').includes('hanging-punctuation');
}

/** Recursive walk — yields every readable file under `dir`. */
function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const stat = statSync(abs);
    if (stat.isDirectory() && isWalkable(entry)) walk(abs, out);
    else if (stat.isFile() && isReadable(entry)) out.push(abs);
  }
}

/** Collect every repo file that mentions the property literal. */
function findHomes(): string[] {
  const all: string[] = [];
  walk(ROOT, all);
  return all.filter(fileHasLiteral).map((abs) => relative(ROOT, abs));
}

// ─── §1 · The literal lives in the two canonical homes ────────────────────

describe('hang progressive-enhancement · §1 the two canonical homes', () => {
  it('app/globals.css declares hanging-punctuation: first last allow-end', () => {
    const css = readFileSync(join(ROOT, 'app/globals.css'), 'utf8');
    expect(css).toMatch(/hanging-punctuation:\s*first\s+last\s+allow-end/);
  });

  it('lib/design/typography.ts mentions hanging-punctuation (docblock + literal)', () => {
    const ts = readFileSync(join(ROOT, 'lib/design/typography.ts'), 'utf8');
    expect(ts).toMatch(/hanging-punctuation/);
  });
});

// ─── §2 · No third home — the literal does not leak ───────────────────────

describe('hang progressive-enhancement · §2 no third home (literal does not leak)', () => {
  it('the property literal is confined to the two homes (+ doc receipts)', () => {
    // The honesty receipt: Safari-only paint should not be patched by a
    // hand-rolled JS shim, an inline style, or a stray utility variant.
    // If a fourth file mentions `hanging-punctuation`, the fence names it.
    const homes = findHomes().filter((rel) => !isDoc(rel) && !isAllowedHome(rel));
    expect(homes).toEqual([]);
  });
});

// ─── §3 · No JS shim disguised as progressive enhancement ─────────────────

describe('hang progressive-enhancement · §3 no JS shim, no canvas hack', () => {
  it('no module names a `hangingPunctuation*` JS identifier (we do not chase Chrome parity)', () => {
    // Tanya UX §3.1 / Elon §1.2: progressive enhancement IS the deliverable.
    // A function or class named `hangingPunctuation*` would be a shim
    // smuggled in under the polish flag — pin the absence loud.
    const all: string[] = [];
    walk(ROOT, all);
    const offenders = all
      .filter((abs) => /\.(ts|tsx|js|jsx)$/.test(abs))
      .filter((abs) => /\bhangingPunctuation[A-Z][A-Za-z0-9]*\s*[=(]/.test(readFileSync(abs, 'utf8')))
      .map((abs) => relative(ROOT, abs));
    expect(offenders).toEqual([]);
  });
});
