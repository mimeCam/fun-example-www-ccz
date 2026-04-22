/**
 * Elevation Adoption Test — raw-shadow / arbitrary-shadow guardrail.
 *
 * Every interactive surface speaks one dialect of depth owned by
 * `lib/design/elevation.ts`. This test fails when:
 *
 *   - a raw `box-shadow:` declaration in component or lib code resolves
 *     to anything other than `var(--sys-elev-*)` or `none`
 *   - a Tailwind arbitrary `shadow-[…]` class slips into a component
 *   - a `boxShadow:` inline-style literal carries an `rgba(0,0,0,…)`
 *     or `color-mix(... --gold ...)` value (the ledger's job)
 *
 * One file, zero config, one allow-list. Mirrors the pattern of
 * `motion-adoption.test.ts`. Honest exemptions are marked in source
 * with an `elevation-ledger:exempt` comment token.
 *
 * Paul's KPI: a PR that adds a raw shadow to any component file should
 * fail this test on first run. Without it, drift returns within a month.
 *
 * Credits: Mike K. (napkin §7 — adoption-guard spec + the
 * single-exemption-token rule), Paul K. (KPI / guard-first ordering),
 * Tanya D. (UX spec §6 — "the guard IS the documentation"), Krystle C.
 * (sprint shape lifted from motion-adoption).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
  ELEVATION_LEDGER_EXEMPT_TOKEN,
  ELEVATION_ORDER,
  LEGACY_SHADOW_ALIASES,
  TINTED_ACCENTS,
} from '../elevation';

const ROOT = join(__dirname, '..', '..', '..');

/** The one file that legitimately owns shadow values. */
const ALLOW = new Set<string>([
  'lib/design/elevation.ts',
]);

/**
 * Per-file allow-list for tinted accents — EXIT doors, not beats. Any new
 * surface using `shadow-rose-glow` or `shadow-cyan-whisper` must be added
 * here with an explicit, reviewer-visible diff. See TINTED_ACCENTS in
 * `lib/design/elevation.ts` for the design rationale.
 *
 * Shape is `{ path → alias[] }`. An empty array means "no tinted accents
 * allowed in this file." Any alias used in a file not listed here fails.
 */
const TINTED_ALLOW: Record<string, readonly string[]> = {
  'components/content/StratifiedRenderer.tsx': ['rose-glow', 'cyan-whisper'],
  'app/resonances/ResonanceEntry.tsx':         ['rose-glow'],
};

/** Directories to scan (adds `app/` so resonances files are covered). */
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
 * Files marked with the exempt token are honest exceptions (e.g.
 * clipboard HTML where CSS vars do not resolve). Mike's call:
 * one explicit token per file, reviewer-visible. Whole-file scope
 * because the token is rare and documenting it once is enough.
 */
function isExempt(src: string): boolean {
  return src.includes(ELEVATION_LEDGER_EXEMPT_TOKEN);
}

// ─── Pattern scanners (pure, each returns a boolean) ───────────────────────

/** Match a Tailwind arbitrary-shadow class like `shadow-[0_2px_8px_…]`. */
function hasTailwindArbitraryShadow(src: string): boolean {
  return /\bshadow-\[[^\]]+\]/.test(src);
}

/** Match a Tailwind arbitrary drop-shadow class like `drop-shadow-[…]`. */
function hasTailwindArbitraryDropShadow(src: string): boolean {
  return /\bdrop-shadow-\[[^\]]+\]/.test(src);
}

/** Match a raw `box-shadow:` declaration in a CSS-in-JS string. */
function hasRawBoxShadowDeclaration(src: string): boolean {
  return /[`'"][^`'"]*box-shadow\s*:[^`'"]*[`'"]/.test(src);
}

/** Match an inline `boxShadow:` whose value contains rgba/color-mix gold. */
function hasInlineBlackOrGoldShadow(src: string): boolean {
  if (!/boxShadow\s*:/.test(src)) return false;
  if (/rgba\(\s*0\s*,\s*0\s*,\s*0/.test(src)) return true;
  return /color-mix\([^)]*--gold/.test(src);
}

/** Build a `\bshadow-(a|b|c)\b` regex from an alias list. Pure. */
function aliasRegex(aliases: readonly string[]): RegExp {
  const escaped = aliases.map((a) => a.replace(/-/g, '\\-'));
  return new RegExp(`\\bshadow-(${escaped.join('|')})\\b`);
}

/** True iff src uses any legacy alias (void/rise/float/gold/*). */
function hasLegacyAlias(src: string): boolean {
  return aliasRegex(LEGACY_SHADOW_ALIASES).test(src);
}

/** True iff src uses a tinted accent not allow-listed for `rel`. */
function hasUnlistedTintedAccent(
  rel: string,
  src: string,
  allow: Record<string, readonly string[]>,
): boolean {
  const listed = new Set(allow[rel] ?? []);
  const unlisted = TINTED_ACCENTS.filter((a) => !listed.has(a));
  if (unlisted.length === 0) return false;
  return aliasRegex(unlisted).test(src);
}

// ─── Violation collector (single source of truth) ──────────────────────────

type Kind =
  | 'tw-shadow'
  | 'tw-drop-shadow'
  | 'raw-decl'
  | 'inline-literal'
  | 'legacy-alias'
  | 'tinted-unlisted';

interface Violation {
  file: string;
  kind: Kind;
}

function pushIf(out: Violation[], cond: boolean, file: string, kind: Kind): void {
  if (cond) out.push({ file, kind });
}

/**
 * Legacy-alias and tinted-accent scans run **even in exempt files** because
 * the exempt token documents inline CSS strings, not Tailwind classes. A
 * legacy Tailwind alias in an exempt file is still a violation of the voice.
 */
function checkAliasLayer(rel: string, src: string): Violation[] {
  if (ALLOW.has(rel)) return [];
  const out: Violation[] = [];
  pushIf(out, hasLegacyAlias(src),                          rel, 'legacy-alias');
  pushIf(out, hasUnlistedTintedAccent(rel, src, TINTED_ALLOW), rel, 'tinted-unlisted');
  return out;
}

function check(path: string, src: string): Violation[] {
  const rel = relativePath(path);
  if (ALLOW.has(rel)) return [];
  const aliasHits = checkAliasLayer(rel, src);
  if (isExempt(src)) return aliasHits;
  const out: Violation[] = [...aliasHits];
  pushIf(out, hasTailwindArbitraryShadow(src),     rel, 'tw-shadow');
  pushIf(out, hasTailwindArbitraryDropShadow(src), rel, 'tw-drop-shadow');
  pushIf(out, hasRawBoxShadowDeclaration(src),     rel, 'raw-decl');
  pushIf(out, hasInlineBlackOrGoldShadow(src),     rel, 'inline-literal');
  return out;
}

function findAllViolations(): Violation[] {
  return collectFiles().flatMap((p) => check(p, readFileSync(p, 'utf8')));
}

// ─── Tests — the whole point ───────────────────────────────────────────────

describe('elevation adoption — every shadow goes through the ledger', () => {
  const violations = findAllViolations();

  it('no Tailwind arbitrary shadows (e.g. shadow-[0_2px_8px_…])', () => {
    const hits = violations.filter((v) => v.kind === 'tw-shadow');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no Tailwind arbitrary drop-shadows (e.g. drop-shadow-[…])', () => {
    const hits = violations.filter((v) => v.kind === 'tw-drop-shadow');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no raw "box-shadow:" declarations in CSS-in-JS strings', () => {
    const hits = violations.filter((v) => v.kind === 'raw-decl');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no inline boxShadow literals carrying rgba(0,0,0,…) or gold color-mix', () => {
    const hits = violations.filter((v) => v.kind === 'inline-literal');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no legacy `shadow-(void|rise|float|gold|gold-intense)` aliases anywhere', () => {
    const hits = violations.filter((v) => v.kind === 'legacy-alias');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('tinted accents live only in the two allow-listed files', () => {
    const hits = violations.filter((v) => v.kind === 'tinted-unlisted');
    expect(hits.map((v) => v.file)).toEqual([]);
  });
});

// ─── Positive tinted-allow-list tests — keep the exit doors documented ─────

describe('tinted accents — the two allow-listed homes are present', () => {
  it('StratifiedRenderer.tsx uses both rose-glow and cyan-whisper', () => {
    const src = readFileSync(
      join(ROOT, 'components/content/StratifiedRenderer.tsx'),
      'utf8',
    );
    expect(src).toMatch(/\bshadow-rose-glow\b/);
    expect(src).toMatch(/\bshadow-cyan-whisper\b/);
  });

  it('ResonanceEntry.tsx uses rose-glow', () => {
    const src = readFileSync(
      join(ROOT, 'app/resonances/ResonanceEntry.tsx'),
      'utf8',
    );
    expect(src).toMatch(/\bshadow-rose-glow\b/);
  });
});

// ─── Positive test — the module itself IS allowed to own values ────────────

describe('elevation adoption — elevation.ts is the one legitimate home', () => {
  it('lib/design/elevation.ts contains numeric shadow definitions', () => {
    const src = readFileSync(join(ROOT, 'lib/design/elevation.ts'), 'utf8');
    expect(src).toMatch(/rest:\s*'none'/);
    expect(src).toMatch(/rgba\(0,0,0,0\.20\)/);
    expect(src).toMatch(/color-mix.*--gold.*12%/);
  });

  it('the exempt token has at least one well-known consumer', () => {
    const clipboardSrc = readFileSync(
      join(ROOT, 'lib/sharing/clipboard-utils.ts'),
      'utf8',
    );
    expect(clipboardSrc).toContain(ELEVATION_LEDGER_EXEMPT_TOKEN);
  });

  it('every beat name appears in the module exports', () => {
    const src = readFileSync(join(ROOT, 'lib/design/elevation.ts'), 'utf8');
    ELEVATION_ORDER.forEach((b) => expect(src).toContain(`${b}:`));
  });
});
