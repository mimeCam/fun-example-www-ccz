/**
 * Spacing Adoption Test — raw-spacing / arbitrary-spacing guardrail.
 *
 * Every rhythmic surface speaks one dialect of padding / margin / gap owned
 * by `lib/design/spacing.ts`. This test fails when:
 *
 *   - a Tailwind preset spacing class like `p-4`, `gap-6`, `mx-8`, `space-y-2`
 *     slips into component or app code outside the allow-list
 *   - a Tailwind arbitrary `p-[16px]`, `m-[1rem]`, `gap-[8px]` carries a
 *     literal length (the ledger's job)
 *   - an inline `style={{ padding: '<n>px' }}` / `margin` / `gap` carries
 *     a numeric-unit literal outside the allow-list
 *
 * One file, zero config, one allow-list. Mirrors the pattern of
 * `typography-adoption.test.ts` and `elevation-adoption.test.ts`. Honest
 * exemptions are marked in source with a `spacing-ledger:exempt` comment
 * token (foreign-DOM clipboard HTML, canvas-rendered SVG geometry, etc.).
 *
 * Paul's KPI: a PR that adds a raw `p-4` to any component file should fail
 * this test on first run. With it, drift cannot return silently. Without it,
 * it returns within a sprint.
 *
 * Credits: Mike K. (napkin §7 — adoption-guard spec + the single-exemption-
 * token rule, lifted from elevation/typography-adoption; the banned-pattern
 * regex sketches in §P8), Paul K. (KPI / guard-first ordering — the
 * pixel-level delivery of "one continuous breath"), Krystle C. (the sprint
 * shape), Tanya D. (the five-rung calibration — macro rungs that cross
 * surface boundaries — which this guard keeps honest), Elon M. (the
 * cross-ledger non-link — spacing does not borrow Typography's `--sys-tick`).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { SPACING_LEDGER_EXEMPT_TOKEN, SPACING_ORDER } from '../spacing';

const ROOT = join(__dirname, '..', '..', '..');

/** Files that legitimately own raw spacing values. */
const ALLOW = new Set<string>([
  'lib/design/spacing.ts',
  'lib/thermal/thermal-tokens.ts',
]);

/** Directories to scan — matches typography-adoption / elevation-adoption. */
const SCAN_DIRS = ['components', 'lib/utils', 'lib/hooks', 'lib/sharing', 'app'];

/** File extensions to scan. */
const SCAN_EXTS = new Set<string>(['.ts', '.tsx']);

/** Raw Tailwind preset spacing numbers (the default scale, bounded). */
const PRESET_NUMBERS =
  '(?:0|0\\.5|1|1\\.5|2|2\\.5|3|3\\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)';

/** Spacing-property Tailwind class prefixes (padding, margin, gap, space). */
const SPACING_PREFIX = '(?:p[xytrbl]?|m[xytrbl]?|gap(?:-[xy])?|space-[xy])';

// ─── File walker (pure, ≤ 10 LOC each) ─────────────────────────────────────

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

/**
 * Files marked with the exempt token are honest exceptions: foreign-DOM
 * clipboard HTML (vars do not resolve), canvas-rendered SVG geometry,
 * inline toast styles. Whole-file scope — the token is rare and
 * documenting it once is enough.
 */
function isExempt(src: string): boolean {
  return src.includes(SPACING_LEDGER_EXEMPT_TOKEN);
}

// ─── Pattern scanners (pure, each returns a boolean) ───────────────────────

/** Match a Tailwind preset spacing class — `p-4`, `gap-6`, `mx-8`, `space-y-2`. */
function hasPresetSpacing(src: string): boolean {
  const rx = new RegExp(`\\b${SPACING_PREFIX}-${PRESET_NUMBERS}\\b`);
  return rx.test(src);
}

/** Match a Tailwind arbitrary spacing class — `p-[16px]`, `m-[1rem]`. */
function hasArbitrarySpacing(src: string): boolean {
  const rx = new RegExp(`\\b${SPACING_PREFIX}-\\[[\\d.]+(?:px|rem)\\]`);
  return rx.test(src);
}

/** Match an inline `style={{ padding/margin/gap: '<n>px' }}` literal. */
function hasInlineSpacingLiteral(src: string): boolean {
  return /style=\{\{[^}]*?\b(padding|margin|gap)\s*:\s*['"`][\d.]+\s*(px|rem)/.test(src);
}

// ─── Violation collector (single source of truth) ──────────────────────────

type Kind = 'tw-preset' | 'tw-arbitrary' | 'inline-literal';

interface Violation {
  file: string;
  kind: Kind;
}

function pushIf(out: Violation[], cond: boolean, file: string, kind: Kind): void {
  if (cond) out.push({ file, kind });
}

function check(path: string, src: string): Violation[] {
  const rel = relativePath(path);
  if (ALLOW.has(rel)) return [];
  if (isExempt(src)) return [];
  const out: Violation[] = [];
  pushIf(out, hasPresetSpacing(src),        rel, 'tw-preset');
  pushIf(out, hasArbitrarySpacing(src),     rel, 'tw-arbitrary');
  pushIf(out, hasInlineSpacingLiteral(src), rel, 'inline-literal');
  return out;
}

function findAllViolations(): Violation[] {
  return collectFiles().flatMap((p) => check(p, readFileSync(p, 'utf8')));
}

// ─── Tests — the whole point ───────────────────────────────────────────────

describe('spacing adoption — every padding/margin/gap goes through the ledger', () => {
  const violations = findAllViolations();

  it('no Tailwind preset spacing classes (p-4, gap-6, mx-8, space-y-2, …)', () => {
    const hits = violations.filter((v) => v.kind === 'tw-preset');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no Tailwind arbitrary spacing classes (p-[16px], m-[1rem], gap-[8px])', () => {
    const hits = violations.filter((v) => v.kind === 'tw-arbitrary');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no inline style={{ padding/margin/gap: "<n>px" }} literals', () => {
    const hits = violations.filter((v) => v.kind === 'inline-literal');
    expect(hits.map((v) => v.file)).toEqual([]);
  });
});

// ─── Positive test — the module itself IS the legitimate home ──────────────

describe('spacing adoption — spacing.ts is the one legitimate home', () => {
  it('lib/design/spacing.ts declares a SPACING_RUNGS array', () => {
    const src = readFileSync(join(ROOT, 'lib/design/spacing.ts'), 'utf8');
    expect(src).toMatch(/SPACING_RUNGS\s*:/);
  });

  it('SPACING_ORDER covers exactly the twelve 1..12 rungs', () => {
    expect(SPACING_ORDER).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('the exempt token name is documented in the module', () => {
    const src = readFileSync(join(ROOT, 'lib/design/spacing.ts'), 'utf8');
    expect(src).toContain(SPACING_LEDGER_EXEMPT_TOKEN);
  });

  it('the thermal-tokens allow-listed file mints --token-space-lift-* values', () => {
    const src = readFileSync(
      join(ROOT, 'lib/thermal/thermal-tokens.ts'),
      'utf8',
    );
    expect(src).toContain('--token-space-lift-');
  });
});

// ─── Allow-list internals — defensive coverage on the matchers ─────────────

describe('spacing adoption — scanner internals are correct', () => {
  it('hasPresetSpacing flags every common spacing abuse', () => {
    expect(hasPresetSpacing('className="p-4"')).toBe(true);
    expect(hasPresetSpacing('className="gap-6"')).toBe(true);
    expect(hasPresetSpacing('className="mx-8"')).toBe(true);
    expect(hasPresetSpacing('className="space-y-2"')).toBe(true);
    expect(hasPresetSpacing('className="mb-12"')).toBe(true);
  });

  it('hasPresetSpacing does NOT flag sys-* or unrelated utilities', () => {
    expect(hasPresetSpacing('className="p-sys-5"')).toBe(false);
    expect(hasPresetSpacing('className="gap-sys-8"')).toBe(false);
    expect(hasPresetSpacing('className="bottom-4"')).toBe(false);
    expect(hasPresetSpacing('className="text-4"')).toBe(false);
  });

  it('hasArbitrarySpacing flags literal-length arbitrary classes', () => {
    expect(hasArbitrarySpacing('className="p-[16px]"')).toBe(true);
    expect(hasArbitrarySpacing('className="m-[1rem]"')).toBe(true);
    expect(hasArbitrarySpacing('className="gap-[8px]"')).toBe(true);
  });

  it('hasArbitrarySpacing does NOT flag unrelated arbitrary classes', () => {
    expect(hasArbitrarySpacing('className="top-[40%]"')).toBe(false);
    expect(hasArbitrarySpacing('className="w-[240px]"')).toBe(false);
  });

  it('hasInlineSpacingLiteral flags React style-object literals', () => {
    expect(hasInlineSpacingLiteral('<div style={{ padding: "16px" }} />')).toBe(true);
    expect(hasInlineSpacingLiteral('<div style={{ margin: "1rem" }} />')).toBe(true);
    expect(hasInlineSpacingLiteral('<div style={{ gap: "8px" }} />')).toBe(true);
  });

  it('hasInlineSpacingLiteral does NOT flag var(--…) references', () => {
    const src = '<div style={{ padding: "var(--sys-space-5)" }} />';
    expect(hasInlineSpacingLiteral(src)).toBe(false);
  });
});
