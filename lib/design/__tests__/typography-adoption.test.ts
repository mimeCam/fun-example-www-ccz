/**
 * Typography Adoption Test — raw-leading / arbitrary-leading guardrail.
 *
 * Every reading surface speaks one dialect of leading owned by
 * `lib/design/typography.ts`. This test fails when:
 *
 *   - a Tailwind preset `leading-(none|tight|snug|normal|relaxed|loose|<n>)`
 *     class slips into component or app code outside `lib/design/`
 *   - a Tailwind arbitrary `leading-[…]` class uses anything other than
 *     `var(--sys-lead-*)` (a static beat). The legacy thermal escape
 *     hatch `leading-[var(--token-line-height)]` is no longer allow-listed
 *     — consumers route through `passageThermalClass()` instead, which
 *     resolves to the canonical `.typo-passage-thermal` rule.
 *   - an inline `style={{ lineHeight: <literal> }}` carries a numeric or
 *     unit literal (the ledger's job)
 *
 * One file, zero config, one allow-list. Mirrors the pattern of
 * `motion-adoption.test.ts` and `elevation-adoption.test.ts`. Honest
 * exemptions are marked in source with a `typography-ledger:exempt`
 * comment token (icon glyphs with `leading-none`, canvas-text math, etc.).
 *
 * Paul's KPI: a PR that adds a raw `leading-relaxed` to any component file
 * should fail this test on first run. Without it, drift returns within a
 * sprint. With it, it does not.
 *
 * Credits: Mike K. (napkin §7 — adoption-guard spec + the single-exemption-
 * token rule, lifted from elevation-adoption), Paul K. (KPI / guard-first
 * ordering — Tanya quotes him on this in the §11 spec), Krystle C. (the
 * sprint shape lifted from motion-adoption), Tanya D. (the per-beat polish
 * — `text-wrap` + kerning — that this guard keeps from being undone; also
 * the §5 tightening that retired the `leading-[var(--token-line-height)]`
 * literal in favor of `.typo-passage-thermal`),
 * Elon M. (the `--sys-tick * N` integer-multiple lock the *sync* test
 * enforces and this *adoption* test backstops by killing arbitrary leading).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
  TYPOGRAPHY_LEDGER_EXEMPT_TOKEN,
  TYPOGRAPHY_ORDER,
} from '../typography';

const ROOT = join(__dirname, '..', '..', '..');

/** The one file that legitimately owns leading vocabulary. */
const ALLOW = new Set<string>([
  'lib/design/typography.ts',
]);

/** Directories to scan (matches elevation-adoption shape). */
const SCAN_DIRS = ['components', 'lib/utils', 'lib/hooks', 'lib/sharing', 'app'];

/** File extensions to scan. */
const SCAN_EXTS = new Set<string>(['.ts', '.tsx']);

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
 * Files marked with the exempt token are honest exceptions: icon glyphs
 * (no reading rhythm), canvas-rendered SVG text (no CSS), foreign
 * clipboard HTML (vars do not resolve). Whole-file scope because the
 * token is rare and documenting it once is enough.
 */
function isExempt(src: string): boolean {
  return src.includes(TYPOGRAPHY_LEDGER_EXEMPT_TOKEN);
}

// ─── Pattern scanners (pure, each returns a boolean) ───────────────────────

/** Match a Tailwind preset leading class — none/tight/snug/normal/relaxed/loose/<n>. */
function hasTailwindPresetLeading(src: string): boolean {
  return /\bleading-(none|tight|snug|normal|relaxed|loose|\d+)\b/.test(src);
}

/**
 * Match a Tailwind arbitrary `leading-[…]` class whose contents are NOT
 * one of the allow-listed CSS vars (`--sys-lead-*` or the thermal
 * `--token-line-height`). The allow-list is built once from TYPOGRAPHY_ORDER
 * so the regex has no chance to drift away from the ledger.
 */
function hasTailwindArbitraryLeading(src: string): boolean {
  const matches = src.matchAll(/\bleading-\[([^\]]+)\]/g);
  for (const m of matches) {
    if (!isAllowedArbitraryLeading(m[1])) return true;
  }
  return false;
}

/**
 * True iff the arbitrary leading payload is a static beat var.
 * The thermal carve-out (`var(--token-line-height)`) is no longer
 * permitted as a literal — consumers use `passageThermalClass()` →
 * `.typo-passage-thermal` instead. (Tanya UIX §5 — vocabulary lock.)
 */
function isAllowedArbitraryLeading(payload: string): boolean {
  const p = payload.trim();
  return TYPOGRAPHY_ORDER.some((b) => p === `var(--sys-lead-${b})`);
}

/**
 * Match an inline `lineHeight: <literal>` in a style object. Allows
 * `var(--…)` references through (the ledger's job is to be the var
 * source). A bare number, a string with a unit, or a CSS-keyword literal
 * fails the guard.
 */
function hasInlineLineHeightLiteral(src: string): boolean {
  const matches = src.matchAll(/\blineHeight\s*:\s*([^,}\n]+)/g);
  for (const m of matches) {
    if (!isAllowedInlineValue(m[1])) return true;
  }
  return false;
}

/** True iff the inline value is a `var(--…)` reference. */
function isAllowedInlineValue(value: string): boolean {
  const v = value.trim().replace(/['"`]/g, '');
  return v.startsWith('var(--');
}

/** Match a Tailwind preset tracking class — tighter/tight/normal/wide/wider/widest. */
function hasTailwindPresetTracking(src: string): boolean {
  return /\btracking-(tighter|tight|normal|wide|wider|widest)\b/.test(src);
}

/**
 * Match a Tailwind arbitrary `tracking-[…]` class whose contents are NOT
 * one of the allow-listed CSS vars (`--sys-track-*` or the thermal
 * `--token-letter-spacing`).
 */
function hasTailwindArbitraryTracking(src: string): boolean {
  const matches = src.matchAll(/\btracking-\[([^\]]+)\]/g);
  for (const m of matches) {
    if (!isAllowedArbitraryTracking(m[1])) return true;
  }
  return false;
}

/**
 * True iff the arbitrary tracking payload is a static beat var.
 * The thermal carve-out (`var(--token-letter-spacing)`) is no longer
 * permitted as a literal — `.typo-passage-thermal` binds it canonically
 * for the body column. (Tanya UIX §5 — vocabulary lock, by symmetry
 * with the leading retirement.)
 */
function isAllowedArbitraryTracking(payload: string): boolean {
  const p = payload.trim();
  return TYPOGRAPHY_ORDER.some((b) => p === `var(--sys-track-${b})`);
}

/**
 * Match an inline `letterSpacing: <literal>` in a style object. Allows
 * `var(--…)` references through. Bare numbers, `em`/`px` literals, and
 * CSS keywords fail the guard.
 */
function hasInlineLetterSpacingLiteral(src: string): boolean {
  const matches = src.matchAll(/\bletterSpacing\s*:\s*([^,}\n]+)/g);
  for (const m of matches) {
    if (!isAllowedInlineValue(m[1])) return true;
  }
  return false;
}

// ─── Violation collector (single source of truth) ──────────────────────────

type Kind =
  | 'tw-preset'
  | 'tw-arbitrary'
  | 'inline-literal'
  | 'tw-preset-track'
  | 'tw-arbitrary-track'
  | 'inline-track-literal';

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
  pushIf(out, hasTailwindPresetLeading(src),      rel, 'tw-preset');
  pushIf(out, hasTailwindArbitraryLeading(src),   rel, 'tw-arbitrary');
  pushIf(out, hasInlineLineHeightLiteral(src),    rel, 'inline-literal');
  pushIf(out, hasTailwindPresetTracking(src),     rel, 'tw-preset-track');
  pushIf(out, hasTailwindArbitraryTracking(src),  rel, 'tw-arbitrary-track');
  pushIf(out, hasInlineLetterSpacingLiteral(src), rel, 'inline-track-literal');
  return out;
}

function findAllViolations(): Violation[] {
  return collectFiles().flatMap((p) => check(p, readFileSync(p, 'utf8')));
}

// ─── Tests — the whole point ───────────────────────────────────────────────

describe('typography adoption — every leading goes through the ledger', () => {
  const violations = findAllViolations();

  it('no Tailwind preset leading classes (leading-relaxed, leading-tight, …)', () => {
    const hits = violations.filter((v) => v.kind === 'tw-preset');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no Tailwind arbitrary leading outside var(--sys-lead-*) — thermal goes through .typo-passage-thermal', () => {
    const hits = violations.filter((v) => v.kind === 'tw-arbitrary');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no inline lineHeight: literals (only var(--…) references allowed)', () => {
    const hits = violations.filter((v) => v.kind === 'inline-literal');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no Tailwind preset tracking classes (tracking-tight, tracking-widest, …)', () => {
    const hits = violations.filter((v) => v.kind === 'tw-preset-track');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no Tailwind arbitrary tracking outside var(--sys-track-*) — thermal goes through .typo-passage-thermal', () => {
    const hits = violations.filter((v) => v.kind === 'tw-arbitrary-track');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no inline letterSpacing: literals (only var(--…) references allowed)', () => {
    const hits = violations.filter((v) => v.kind === 'inline-track-literal');
    expect(hits.map((v) => v.file)).toEqual([]);
  });
});

// ─── Positive test — the module itself IS the legitimate home ──────────────

describe('typography adoption — typography.ts is the one legitimate home', () => {
  it('lib/design/typography.ts contains the six-beat TYPOGRAPHY const', () => {
    const src = readFileSync(join(ROOT, 'lib/design/typography.ts'), 'utf8');
    expect(src).toMatch(/TYPOGRAPHY\s*=/);
    TYPOGRAPHY_ORDER.forEach((b) => expect(src).toContain(`${b}:`));
  });

  it('the exempt token name is documented in the module', () => {
    const src = readFileSync(join(ROOT, 'lib/design/typography.ts'), 'utf8');
    expect(src).toContain(TYPOGRAPHY_LEDGER_EXEMPT_TOKEN);
  });
});

// ─── Positive test — the migration target replaces the retired literals ─────

describe('typography adoption — passageThermalClass is the canonical body-prose handle', () => {
  const CSS = readFileSync(join(ROOT, 'app/globals.css'), 'utf8');

  it('the canonical class .typo-passage-thermal is defined in globals.css', () => {
    expect(CSS).toMatch(/\.typo-passage-thermal\s*\{[^}]*line-height:\s*var\(--token-line-height\)/);
  });

  it('passageThermalClass() is exported and returns the canonical class name', () => {
    const src = readFileSync(join(ROOT, 'lib/design/typography.ts'), 'utf8');
    expect(src).toMatch(/export\s+const\s+passageThermalClass\b/);
    expect(src).toContain("'typo-passage-thermal'");
  });

  it('no consumer file outside the ledger imports the retired literals', () => {
    // The migration is complete: every prior body-prose call site that
    // used `leading-[var(--token-line-height)]` now imports
    // `passageThermalClass` from the ledger. Sanity: at least one
    // non-test consumer references the helper by name.
    const consumers = collectFiles().filter((p) => {
      const rel = relativePath(p);
      if (ALLOW.has(rel)) return false;
      return readFileSync(p, 'utf8').includes('passageThermalClass');
    });
    expect(consumers.length).toBeGreaterThan(0);
  });
});

// ─── Allow-list internals — defensive coverage on the matchers ─────────────

describe('typography adoption — allow-list internals are correct', () => {
  it('isAllowedArbitraryLeading accepts every --sys-lead-* var', () => {
    TYPOGRAPHY_ORDER.forEach((b) => {
      expect(isAllowedArbitraryLeading(`var(--sys-lead-${b})`)).toBe(true);
    });
  });

  it('isAllowedArbitraryLeading rejects the retired thermal --token-line-height literal', () => {
    expect(isAllowedArbitraryLeading('var(--token-line-height)')).toBe(false);
  });

  it('isAllowedArbitraryLeading rejects unrelated vars and bare numbers', () => {
    expect(isAllowedArbitraryLeading('var(--something-else)')).toBe(false);
    expect(isAllowedArbitraryLeading('1.6')).toBe(false);
    expect(isAllowedArbitraryLeading('20px')).toBe(false);
  });

  it('isAllowedArbitraryTracking accepts every --sys-track-* var', () => {
    TYPOGRAPHY_ORDER.forEach((b) => {
      expect(isAllowedArbitraryTracking(`var(--sys-track-${b})`)).toBe(true);
    });
  });

  it('isAllowedArbitraryTracking rejects the retired thermal --token-letter-spacing literal', () => {
    expect(isAllowedArbitraryTracking('var(--token-letter-spacing)')).toBe(false);
  });

  it('isAllowedArbitraryTracking rejects unrelated vars and bare em literals', () => {
    expect(isAllowedArbitraryTracking('var(--something-else)')).toBe(false);
    expect(isAllowedArbitraryTracking('0.05em')).toBe(false);
    expect(isAllowedArbitraryTracking('-0.01em')).toBe(false);
  });
});
