/**
 * Radius Adoption Test — raw-rounded / arbitrary-rounded guardrail.
 *
 * Every corner on the page speaks one dialect of curvature owned by
 * `lib/design/radius.ts`. This test fails when:
 *
 *   - a Tailwind preset class like `rounded-lg`, `rounded-xl`, `rounded-full`,
 *     `rounded-md`, `rounded-3xl` slips into component or lib code outside
 *     the allow-list
 *   - a Tailwind arbitrary `rounded-[16px]`, `rounded-[50%]` carries a
 *     literal length (the ledger's job)
 *   - an inline `style={{ borderRadius: '<n>px' }}` / `'<n>rem'` literal
 *     lands outside the allow-list
 *
 * One file, zero config, two allow-listed homes. Mirrors the pattern of
 * `spacing-adoption.test.ts` and `elevation-adoption.test.ts`. Honest
 * exemptions are marked in source with a `radius-ledger:exempt` comment
 * token (foreign-DOM toasts, inline keyframe internals, etc.).
 *
 * Paul's KPI: a PR that adds a raw `rounded-xl` to any component should
 * fail this test on first run. With it, drift cannot return silently.
 *
 * Credits: Mike K. (napkin §7 — adoption-guard spec + the single-exemption-
 * token rule, lifted from spacing/elevation-adoption; the banned-pattern
 * regex enumerated to Tailwind's preset rounded scale), Tanya D. (UX §7 —
 * the four-rungs-or-nothing rule that this guard enforces at the pixel
 * level; the "reader must not detect this sprint" outcome test), Paul K.
 * (KPI / guard-first ordering), Krystle C. (sprint shape), Elon M. (the
 * 3-site real-migration scope — this guard greenlights only those three
 * and fails on anything new).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
  RADIUS_LEDGER_EXEMPT_TOKEN,
  RADIUS_ORDER,
  THERMAL_RADIUS_GRANDFATHERED_PATHS,
} from '../radius';

const ROOT = join(__dirname, '..', '..', '..');

/**
 * Files that legitimately own raw radius values.
 *   - `lib/design/radius.ts` — the TS mirror of the ledger
 *   - `lib/thermal/thermal-tokens.ts` — mints `--token-radius-soft`
 *     (the sole thermal carve-out) and references `rounded-lg` in
 *     reviewer-facing comments
 */
const ALLOW = new Set<string>([
  'lib/design/radius.ts',
  'lib/thermal/thermal-tokens.ts',
]);

/**
 * Directories to scan — matches the other adoption guards **plus**
 * `lib/quote-cards`, because Mike's napkin §7 calls out the export-toast
 * drift site there. Expanding this single scanner is not a cross-ledger
 * scope change — it is the radius guard being honest about where corners
 * live.
 */
const SCAN_DIRS = [
  'components',
  'lib/utils',
  'lib/hooks',
  'lib/sharing',
  'lib/quote-cards',
  'app',
];

/** File extensions to scan. */
const SCAN_EXTS = new Set<string>(['.ts', '.tsx']);

/**
 * Tailwind's preset rounded scale (default, plus `xs` for future-proofing).
 * `rounded-sys-*` does NOT match because `sys-` separates `rounded-` from
 * the preset token name; `\brounded-(none|xs|...)\b` only fires on the
 * unprefixed Tailwind scale.
 */
const PRESET_ROUNDED = '(?:none|xs|sm|md|lg|xl|2xl|3xl|full)';

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
 * toasts (clipboard HTML, quote-card export toasts) where CSS vars do not
 * resolve. Whole-file scope — the token is rare and documenting it once
 * is enough.
 */
function isExempt(src: string): boolean {
  return src.includes(RADIUS_LEDGER_EXEMPT_TOKEN);
}

// ─── Pattern scanners (pure, each returns a boolean) ───────────────────────

/** Match a Tailwind preset rounded class — `rounded-lg`, `rounded-full`, … */
function hasPresetRounded(src: string): boolean {
  const rx = new RegExp(`\\brounded-${PRESET_ROUNDED}\\b`);
  return rx.test(src);
}

/**
 * Match a bare `rounded` class — Tailwind's default (0.25rem). We require
 * the token to sit in a className-like context: either immediately
 * followed by another hyphenated Tailwind utility (`rounded bg-surface`)
 * or pinned against a string/template delimiter (`"rounded"`, \`rounded\`).
 * Prose "(rounded up)" in JSDoc does not qualify.
 */
function hasBareRounded(src: string): boolean {
  return /(?:^|[\s"'`])rounded(?=\s+\w+-|\s*["'`])/.test(src);
}

/** Match a Tailwind arbitrary rounded class — `rounded-[16px]`, `rounded-[50%]`. */
function hasArbitraryRounded(src: string): boolean {
  return /\brounded-\[[^\]]+\]/.test(src);
}

/** Match an inline `style={{ borderRadius: '<n>px|rem' }}` literal. */
function hasInlineRadiusLiteral(src: string): boolean {
  return /style=\{\{[^}]*?\bborderRadius\s*:\s*['"`][\d.]+\s*(px|rem)/.test(src);
}

/**
 * Match a raw `.thermal-radius` / `.thermal-radius-wide` class literal —
 * the rung-level thermal carve-out that is supposed to flow through
 * `thermalRadiusClassByPosture(posture)` (Mike #35 §4 / Tanya UX #92 §2.1).
 *
 * The helper itself returns the literal at runtime, so a file that uses
 * the helper does NOT carry the raw token in source. The defensive guard
 * `!src.includes('thermalRadiusClassByPosture')` lets the helper file +
 * any consumer that imports it pass the fence.
 */
const THERMAL_RADIUS_RX = /\bthermal-radius(?:-wide)?\b/;

function hasThermalRadiusRaw(src: string): boolean {
  return THERMAL_RADIUS_RX.test(src) && !src.includes('thermalRadiusClassByPosture');
}

// ─── Violation collector (single source of truth) ──────────────────────────

type Kind =
  | 'tw-preset'
  | 'tw-bare'
  | 'tw-arbitrary'
  | 'inline-literal'
  | 'tw-thermal-radius';

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
  pushIf(out, hasPresetRounded(src),      rel, 'tw-preset');
  pushIf(out, hasBareRounded(src),        rel, 'tw-bare');
  pushIf(out, hasArbitraryRounded(src),   rel, 'tw-arbitrary');
  pushIf(out, hasInlineRadiusLiteral(src),rel, 'inline-literal');
  if (!isThermalRadiusGrandfathered(rel)) {
    pushIf(out, hasThermalRadiusRaw(src), rel, 'tw-thermal-radius');
  }
  return out;
}

/**
 * Drift receipts that pre-date the helper migration are grandfathered —
 * one entry shrinks per PR (Mike #35 §4: 14→13 with the Threshold
 * graduation). Only files NOT on this list are fenced for raw
 * `thermal-radius`; new drift fails the build on first run with a
 * posture-vocabulary message (Tanya UX §4.1).
 */
function isThermalRadiusGrandfathered(rel: string): boolean {
  return (THERMAL_RADIUS_GRANDFATHERED_PATHS as readonly string[]).includes(rel);
}

function findAllViolations(): Violation[] {
  return collectFiles().flatMap((p) => check(p, readFileSync(p, 'utf8')));
}

// ─── Tests — the whole point ───────────────────────────────────────────────

describe('radius adoption — every corner goes through the ledger', () => {
  const violations = findAllViolations();

  it('no Tailwind preset rounded classes (rounded-lg, rounded-xl, rounded-full, …)', () => {
    const hits = violations.filter((v) => v.kind === 'tw-preset');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no bare `rounded` class (Tailwind 0.25rem default)', () => {
    const hits = violations.filter((v) => v.kind === 'tw-bare');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no Tailwind arbitrary rounded classes (rounded-[16px], rounded-[50%])', () => {
    const hits = violations.filter((v) => v.kind === 'tw-arbitrary');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no inline style={{ borderRadius: "<n>px" }} literals', () => {
    const hits = violations.filter((v) => v.kind === 'inline-literal');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no unspoken `thermal-radius` literals outside the grandfather list', () => {
    const hits = violations.filter((v) => v.kind === 'tw-thermal-radius');
    expect(hits.map((v) => v.file)).toEqual([]);
  });
});

// ─── Positive test — the module itself IS the legitimate home ─────────────

describe('radius adoption — radius.ts is the one legitimate home', () => {
  it('lib/design/radius.ts declares a RADIUS object', () => {
    const src = readFileSync(join(ROOT, 'lib/design/radius.ts'), 'utf8');
    expect(src).toMatch(/export const RADIUS\s*=/);
  });

  it('RADIUS_ORDER covers exactly the four rungs', () => {
    expect(RADIUS_ORDER).toEqual(['soft', 'medium', 'wide', 'full']);
  });

  it('the exempt token name is documented in the module', () => {
    const src = readFileSync(join(ROOT, 'lib/design/radius.ts'), 'utf8');
    expect(src).toContain(RADIUS_LEDGER_EXEMPT_TOKEN);
  });

  it('the thermal-tokens allow-listed file mints --token-radius-soft', () => {
    const src = readFileSync(
      join(ROOT, 'lib/thermal/thermal-tokens.ts'),
      'utf8',
    );
    expect(src).toContain('--token-radius-soft');
  });
});

// ─── Allow-list internals — defensive coverage on the matchers ─────────────

describe('radius adoption — scanner internals are correct', () => {
  it('hasPresetRounded flags every common radius abuse', () => {
    expect(hasPresetRounded('className="rounded-lg"')).toBe(true);
    expect(hasPresetRounded('className="rounded-xl"')).toBe(true);
    expect(hasPresetRounded('className="rounded-full"')).toBe(true);
    expect(hasPresetRounded('className="rounded-md"')).toBe(true);
    expect(hasPresetRounded('className="rounded-none"')).toBe(true);
  });

  it('hasPresetRounded does NOT flag sys-* aliases', () => {
    expect(hasPresetRounded('className="rounded-sys-soft"')).toBe(false);
    expect(hasPresetRounded('className="rounded-sys-medium"')).toBe(false);
    expect(hasPresetRounded('className="rounded-sys-wide"')).toBe(false);
    expect(hasPresetRounded('className="rounded-sys-full"')).toBe(false);
  });

  it('hasBareRounded flags Tailwind default (`rounded` alone)', () => {
    expect(hasBareRounded('className="rounded"')).toBe(true);
    expect(hasBareRounded('className=" rounded "')).toBe(true);
  });

  it('hasBareRounded does NOT flag hyphenated variants', () => {
    expect(hasBareRounded('className="rounded-sys-soft"')).toBe(false);
    expect(hasBareRounded('className="rounded-lg"')).toBe(false);
    expect(hasBareRounded('className="rounded-full"')).toBe(false);
  });

  it('hasArbitraryRounded flags literal-length arbitrary classes', () => {
    expect(hasArbitraryRounded('className="rounded-[16px]"')).toBe(true);
    expect(hasArbitraryRounded('className="rounded-[1rem]"')).toBe(true);
    expect(hasArbitraryRounded('className="rounded-[50%]"')).toBe(true);
  });

  it('hasArbitraryRounded does NOT flag unrelated arbitrary classes', () => {
    expect(hasArbitraryRounded('className="w-[240px]"')).toBe(false);
    expect(hasArbitraryRounded('className="top-[40%]"')).toBe(false);
  });

  it('hasInlineRadiusLiteral flags React style-object literals', () => {
    expect(hasInlineRadiusLiteral('<div style={{ borderRadius: "12px" }} />')).toBe(true);
    expect(hasInlineRadiusLiteral('<div style={{ borderRadius: "0.75rem" }} />')).toBe(true);
  });

  it('hasInlineRadiusLiteral does NOT flag var(--…) references', () => {
    const src = '<div style={{ borderRadius: "var(--sys-radius-wide)" }} />';
    expect(hasInlineRadiusLiteral(src)).toBe(false);
  });

  it('hasThermalRadiusRaw flags raw `.thermal-radius` and `.thermal-radius-wide`', () => {
    expect(hasThermalRadiusRaw('className="thermal-radius"')).toBe(true);
    expect(hasThermalRadiusRaw('className="thermal-radius-wide"')).toBe(true);
    expect(hasThermalRadiusRaw('thermal-shadow thermal-radius overflow-hidden')).toBe(true);
  });

  it('hasThermalRadiusRaw passes when the file imports / uses the helper', () => {
    const src =
      'import { thermalRadiusClassByPosture } from "@/lib/design/radius";\n' +
      "const x = thermalRadiusClassByPosture('held');";
    expect(hasThermalRadiusRaw(src)).toBe(false);
  });

  it('hasThermalRadiusRaw does NOT flag unrelated thermal-* tokens', () => {
    expect(hasThermalRadiusRaw('className="thermal-shadow"')).toBe(false);
    expect(hasThermalRadiusRaw('className="thermal-accent"')).toBe(false);
  });
});

// ─── Grandfather list — drift receipts, decrementing per migration ────────

describe('thermal-radius grandfather list — auditable drift, shrinking', () => {
  it('every entry is a real, readable source path (no dead receipts)', () => {
    THERMAL_RADIUS_GRANDFATHERED_PATHS.forEach((p) => {
      expect(() => readFileSync(join(ROOT, p), 'utf8')).not.toThrow();
    });
  });

  it('no grandfather entry duplicates an ALLOW-list path (no double-coverage)', () => {
    THERMAL_RADIUS_GRANDFATHERED_PATHS.forEach((p) => {
      expect(ALLOW.has(p)).toBe(false);
    });
  });

  it('every grandfather entry actually carries a raw thermal-radius token', () => {
    THERMAL_RADIUS_GRANDFATHERED_PATHS.forEach((p) => {
      const src = readFileSync(join(ROOT, p), 'utf8');
      expect(THERMAL_RADIUS_RX.test(src)).toBe(true);
    });
  });

  it('the migrated chamber (Threshold.tsx) is OFF the grandfather list', () => {
    expect(THERMAL_RADIUS_GRANDFATHERED_PATHS)
      .not.toContain('components/shared/Threshold.tsx');
  });

  it('counter shrinks one per PR — current size is 2 (was 3 pre-MirrorLoadingSurface)', () => {
    expect(THERMAL_RADIUS_GRANDFATHERED_PATHS.length).toBe(2);
  });

  it('the migrated recognition-letter (ReturnLetter.tsx) is OFF the grandfather list', () => {
    expect(THERMAL_RADIUS_GRANDFATHERED_PATHS)
      .not.toContain('components/return/ReturnLetter.tsx');
  });

  it('the migrated cold-start card (ExploreArticleCard.tsx) is OFF the grandfather list', () => {
    expect(THERMAL_RADIUS_GRANDFATHERED_PATHS)
      .not.toContain('components/explore/ExploreArticleCard.tsx');
  });

  it('the migrated loading surface (MirrorLoadingSurface.tsx) is OFF the grandfather list', () => {
    expect(THERMAL_RADIUS_GRANDFATHERED_PATHS)
      .not.toContain('components/mirror/MirrorLoadingSurface.tsx');
  });
});
