/**
 * Filled-Glyph Optical-Lift Adoption Test — the third grep-fence in the
 * caption-metric / numeric-features family.
 *
 * One literal, one canonical home: `relative -top-[0.5px]` (the 0.5px
 * Tailwind nudge that compensates for filled-glyph centroid drift at
 * `text-sys-micro`) lives ONLY in `lib/design/typography.ts`, exported
 * as `FILLED_GLYPH_OPTICAL_LIFT_CLASS`. Two consumers (the worldview
 * and archetype chip manifests) reach for the constant by name. Tailwind
 * JIT scans `lib/**\/*.ts`, so the literal in the export is enough to
 * emit the utility once.
 *
 * **The narrow fence** (Mike #100 §1 — *one literal, three legal homes
 * (one export + two consumers), one grep-fence*): a single regex family,
 * one allow-list. A third spelling fails CI and names the legal exits.
 *
 *   • `relative -top-[0.5px]` — only legal in
 *     `lib/design/typography.ts` (the canonical export). Consumer
 *     manifests reference `FILLED_GLYPH_OPTICAL_LIFT_CLASS` by name.
 *
 * Mirror of `numeric-features-adoption.test.ts` — comment-blind line
 * normalizer (three passes), word-boundary regex, path-allow-list,
 * inline exempt token. Reviewer muscle memory unchanged (Tanya UX #60 §3
 * — *shape decides group; new audits land in the group whose shape they
 * share*).
 *
 * **What this test does NOT try to assert** (Mike §4.5, Tanya §4.3): the
 * sub-pixel paint receipt — `-top-[0.5px]` may quantize to 0 on a 1×
 * display with subpixel-AA off. Source-level token vs. paint-byte audit
 * is a category split; the latter is out of scope for this sprint.
 *
 * Credits: Mike K. (#100 §1 / §4.2 — adoption-guard spec, the *one
 * literal, three legal homes* shape, JSDoc-says-physics rule, mirror of
 * numeric-features fence; #38 — the path-allow-list pattern lifted from
 * alpha-adoption), Tanya D. (#62 §4.1 — the per-glyph optical-baseline
 * nudge that motivates the literal; #60 §3 — *shape decides group*),
 * Krystle C. (referenced — original promotion scope: one literal, two
 * homes, one grep-fence), Elon M. (referenced — *Name the cause, not
 * the social agreement*; the boring fence shape).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

/** Inline token a caller writes when intentionally bypassing the fence. */
export const FILLED_GLYPH_LIFT_EXEMPT_TOKEN = 'filled-glyph-lift:exempt';

/** Files that legitimately spell the raw `relative -top-[0.5px]` literal.
 * One home — the canonical export in the typography ledger. Both consumer
 * manifests reach for `FILLED_GLYPH_OPTICAL_LIFT_CLASS` by name. */
const LIFT_ALLOW = new Set<string>([
  'lib/design/typography.ts',
]);

/** Directories to scan (matches numeric-features-adoption's footprint). */
const SCAN_DIRS = ['components', 'lib', 'app'];

/** File extensions to scan. */
const SCAN_EXTS = new Set<string>(['.ts', '.tsx']);

// ─── File walker (pure, ≤ 10 LOC each) ───────────────────────────────────

function isScannableFile(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.'));
  if (!SCAN_EXTS.has(ext)) return false;
  if (path.endsWith('.test.ts') || path.endsWith('.test.tsx')) return false;
  if (path.endsWith('.d.ts')) return false;
  return !path.includes(`${sep}__tests__${sep}`);
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

// ─── Pattern scanners (pure) ─────────────────────────────────────────────

/** The 0.5px optical-lift literal. Whitespace between `relative` and the
 * `-top-[0.5px]` token is tolerant (one or more spaces) so a future
 * formatter pass cannot smuggle drift in under a tab/space difference. */
const LIFT_RX = /relative\s+-top-\[0\.5px\]/;

/** Strip every comment region (line, block, JSX-block) from `src`,
 * preserving newline boundaries so line numbers in violations remain
 * accurate. Three passes — `{/* ... *\/}` (JSX), `/* ... *\/` (JS
 * block), `// ...` (line). Pure, ≤ 10 LOC. */
function stripComments(src: string): string {
  const blank = (m: string): string => m.replace(/[^\n]/g, ' ');
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/\/\/[^\n]*/g, blank);
}

/** Split source on newlines so we can check exemption per line. */
function lines(src: string): string[] {
  return src.split(/\r?\n/);
}

/**
 * True iff this line carries the inline exempt token OR is inside a
 * contiguous code block opened by a comment carrying it. Same shape as
 * `lineIsExempt` in numeric-features-adoption — go past a blank line
 * and the exemption ends.
 */
function lineIsExempt(ls: readonly string[], i: number): boolean {
  for (let j = i; j >= 0; j--) {
    if (ls[j].includes(FILLED_GLYPH_LIFT_EXEMPT_TOKEN)) return true;
    if (j < i && ls[j].trim() === '') return false;
  }
  return false;
}

/** True iff `line` carries the optical-lift literal. */
function carriesLift(line: string): boolean {
  return LIFT_RX.test(line);
}

// ─── Violation collector ─────────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  match: string;
}

/** Collect a single line's violation, if any. Pure, ≤ 10 LOC. */
function collectLine(
  rel: string,
  code: readonly string[],
  original: readonly string[],
  i: number,
): Violation | null {
  if (!carriesLift(code[i])) return null;
  if (LIFT_ALLOW.has(rel)) return null;
  if (lineIsExempt(original, i)) return null;
  return { file: rel, line: i + 1, match: original[i].trim() };
}

function scanFile(rel: string, src: string): Violation[] {
  const original = lines(src);
  const code = lines(stripComments(src));
  const out: Violation[] = [];
  code.forEach((_, i) => {
    const v = collectLine(rel, code, original, i);
    if (v) out.push(v);
  });
  return out;
}

function findAllViolations(): Violation[] {
  return collectFiles().flatMap((p) =>
    scanFile(relativePath(p), readFileSync(p, 'utf8')),
  );
}

// ─── Tests — the grep-fence ──────────────────────────────────────────────

describe('filled-glyph-lift adoption — every optical-lift literal routes through the canonical home', () => {
  const violations = findAllViolations();

  /** Human-readable fix hint — names the home and the exit token. */
  const fixHint =
    `    → import FILLED_GLYPH_OPTICAL_LIFT_CLASS from lib/design/typography\n` +
    `      and reference it from the per-glyph nudge map at the surface\n` +
    `      manifest (lib/design/worldview.ts or lib/design/archetype-accents.ts)\n` +
    `    → exempt: // ${FILLED_GLYPH_LIFT_EXEMPT_TOKEN} — <honest reason>`;

  it('no module outside the typography ledger spells the relative -top-[0.5px] literal', () => {
    const message = violations
      .map((v) => `  ${v.file}:${v.line} — ${v.match}\n${fixHint}`)
      .join('\n');
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + message);
  });
});

// ─── Positive tests — the typography ledger owns the canonical literal ───

describe('filled-glyph-lift adoption — typography ledger exports the canonical class', () => {
  const src = readFileSync(
    join(ROOT, 'lib/design/typography.ts'),
    'utf8',
  );

  it('exports FILLED_GLYPH_OPTICAL_LIFT_CLASS as the canonical name', () => {
    expect(src).toContain('FILLED_GLYPH_OPTICAL_LIFT_CLASS');
  });

  it('FILLED_GLYPH_OPTICAL_LIFT_CLASS binds to the verbatim Tailwind literal (JIT-scannable)', () => {
    expect(src).toMatch(
      /FILLED_GLYPH_OPTICAL_LIFT_CLASS\s*=\s*['"]relative -top-\[0\.5px\]['"]/,
    );
  });
});

// ─── Positive tests — the two consumer ledgers reach for the constant ────

describe('filled-glyph-lift adoption — worldview ledger imports the constant', () => {
  const src = readFileSync(
    join(ROOT, 'lib/design/worldview.ts'),
    'utf8',
  );

  it('worldview imports FILLED_GLYPH_OPTICAL_LIFT_CLASS from typography ledger', () => {
    expect(src).toMatch(
      /import\s*\{[^}]*FILLED_GLYPH_OPTICAL_LIFT_CLASS[^}]*\}\s*from\s*['"]@\/lib\/design\/typography['"]/,
    );
  });

  it('worldview wires the constant into the per-glyph nudge map', () => {
    expect(src).toMatch(
      /WORLDVIEW_GLYPH_NUDGE[\s\S]*FILLED_GLYPH_OPTICAL_LIFT_CLASS/,
    );
  });
});

describe('filled-glyph-lift adoption — archetype-accents ledger imports the constant', () => {
  const src = readFileSync(
    join(ROOT, 'lib/design/archetype-accents.ts'),
    'utf8',
  );

  it('archetype-accents imports FILLED_GLYPH_OPTICAL_LIFT_CLASS from typography ledger', () => {
    expect(src).toMatch(
      /import\s*\{[^}]*FILLED_GLYPH_OPTICAL_LIFT_CLASS[^}]*\}\s*from\s*['"]@\/lib\/design\/typography['"]/,
    );
  });

  it('archetype-accents wires the constant into the per-glyph nudge map', () => {
    expect(src).toMatch(
      /ARCHETYPE_GLYPH_NUDGE[\s\S]*FILLED_GLYPH_OPTICAL_LIFT_CLASS/,
    );
  });
});

// ─── Positive test — exempt token is a discoverable string constant ──────

describe('filled-glyph-lift adoption — exempt token is exported', () => {
  it('the inline-exempt token is a discoverable string constant', () => {
    expect(FILLED_GLYPH_LIFT_EXEMPT_TOKEN).toBe('filled-glyph-lift:exempt');
  });
});
