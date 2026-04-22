/**
 * Spacing Sync Test — CSS ↔ TS drift guard.
 *
 * Reads `app/globals.css`, parses every `--sys-space-*` declaration,
 * asserts each `calc(<rem> + var(--token-space-lift-N, 0px))` matches
 * `SPACING_RUNGS[N-1]` exactly. If someone edits a number in either
 * mirror but not the other, this test fails fast and names the rung.
 *
 * Mirrors the strategy of `typography-sync.test.ts`. No build step, no
 * codegen — a plain regex read from disk at test time.
 *
 * Mirror discipline: every rung in CSS appears in TS, every rung in TS
 * appears in CSS, every rung carries its `--token-space-lift-N` fallback,
 * and `--sys-tick` is **not** referenced inside any `--sys-space-*`
 * declaration (different ledgers, different unit spaces).
 *
 * Credits: Mike K. (napkin §3 / §7.2 — the regex-over-CSS pattern, the
 * "don't parse CSS with a parser" discipline lifted from typography-sync),
 * Krystle C. (sprint shape — the sync test is the contract that makes
 * the adoption guard enforceable), Elon M. (the `--sys-tick` non-link
 * assertion that kills Problem C before it's born), Tanya D. (the
 * non-decreasing invariant that keeps tightest→loosest stable).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  SPACING_RUNGS,
  SPACING_ORDER,
  SysSpaceIndex,
  REM_TO_PX,
  rungOf,
  spaceVar,
  liftVar,
  spaceClassOf,
  spacingInvariantHolds,
  THERMAL_LIFT_VAR_PREFIX,
} from '../spacing';

const CSS = readFileSync(resolve(__dirname, '../../../app/globals.css'), 'utf-8');

// ─── Parser helpers — pure, each ≤ 10 LOC ─────────────────────────────────

/** Extract the full body of a `--sys-space-N: …;` declaration. */
function readSpaceDecl(n: number): string | undefined {
  const rx = new RegExp(`--sys-space-${n}:\\s*([^;]+);`);
  const match = CSS.match(rx);
  return match ? match[1].trim() : undefined;
}

/** Extract the rem value from the decl body `calc(<rem>rem + var(...))`. */
function readRemFromDecl(body: string | undefined): number | undefined {
  if (!body) return undefined;
  const match = body.match(/calc\(\s*([\d.]+)rem/);
  return match ? Number(match[1]) : undefined;
}

/** True iff the decl body references `--token-space-lift-N` with a 0px fallback. */
function hasLiftFallback(body: string | undefined, n: number): boolean {
  if (!body) return false;
  const rx = new RegExp(`var\\(--token-space-lift-${n}\\s*,\\s*0px\\)`);
  return rx.test(body);
}

/** True iff the decl body references `--sys-tick` — MUST be false (Elon §Problem C). */
function referencesSysTick(body: string | undefined): boolean {
  return Boolean(body && /--sys-tick\b/.test(body));
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('SPACING_RUNGS ↔ globals.css --sys-space-* sync', () => {
  SPACING_ORDER.forEach((n) => {
    it(`--sys-space-${n} exists in CSS with the TS rem value`, () => {
      const body = readSpaceDecl(n);
      expect(body).toBeDefined();
      expect(readRemFromDecl(body)).toBe(rungOf(n).rem);
    });

    it(`--sys-space-${n} carries the --token-space-lift-${n}, 0px fallback`, () => {
      const body = readSpaceDecl(n);
      expect(hasLiftFallback(body, n)).toBe(true);
    });

    it(`--sys-space-${n} does NOT reference --sys-tick (cross-ledger ban)`, () => {
      const body = readSpaceDecl(n);
      expect(referencesSysTick(body)).toBe(false);
    });
  });

  it('every --sys-space-* in CSS is represented in SPACING_RUNGS', () => {
    const cssRungs = Array.from(CSS.matchAll(/--sys-space-(\d+):/g))
      .map((m) => Number(m[1]))
      .filter((n) => n >= 1 && n <= 12);
    expect(new Set(cssRungs).size).toBe(SPACING_RUNGS.length);
  });

  it('all twelve rungs exist in CSS', () => {
    SPACING_ORDER.forEach((n) => expect(readSpaceDecl(n)).toBeDefined());
  });
});

describe('SPACING_RUNGS structural invariants', () => {
  it('spacingInvariantHolds() is true', () => {
    expect(spacingInvariantHolds()).toBe(true);
  });

  it('every rung has pxNominal = rem × 16 (browser default)', () => {
    SPACING_RUNGS.forEach((r) => expect(r.pxNominal).toBe(r.rem * REM_TO_PX));
  });

  it('rungs are strictly increasing tightest → loosest', () => {
    for (let i = 1; i < SPACING_RUNGS.length; i++) {
      expect(SPACING_RUNGS[i].rem).toBeGreaterThan(SPACING_RUNGS[i - 1].rem);
    }
  });

  it('rung 1 is the tightest, rung 12 is the loosest', () => {
    expect(SPACING_RUNGS[0].pxNominal).toBe(4);
    expect(SPACING_RUNGS[11].pxNominal).toBe(96);
  });

  it('REM_TO_PX is the 16px browser default (never remapped)', () => {
    expect(REM_TO_PX).toBe(16);
  });
});

describe('spacing helpers', () => {
  it('rungOf returns the 1-based rung record for each index', () => {
    SPACING_ORDER.forEach((n) => expect(rungOf(n)).toBe(SPACING_RUNGS[n - 1]));
  });

  it('spaceVar returns the matching CSS custom-property reference', () => {
    expect(spaceVar(1)).toBe('var(--sys-space-1)');
    expect(spaceVar(12)).toBe('var(--sys-space-12)');
  });

  it('liftVar returns the thermal lift var with the 0px fallback', () => {
    expect(liftVar(5)).toBe('var(--token-space-lift-5, 0px)');
    expect(liftVar(12)).toBe('var(--token-space-lift-12, 0px)');
  });

  it('spaceClassOf returns the Tailwind utility (p-sys-N, gap-sys-N, …)', () => {
    expect(spaceClassOf('p', 5)).toBe('p-sys-5');
    expect(spaceClassOf('gap', 8)).toBe('gap-sys-8');
    expect(spaceClassOf('mb', 11)).toBe('mb-sys-11');
  });

  it('THERMAL_LIFT_VAR_PREFIX lines up with liftVar() output', () => {
    const n: SysSpaceIndex = 7;
    expect(liftVar(n)).toContain(`${THERMAL_LIFT_VAR_PREFIX}${n}`);
  });
});

describe('cross-ledger non-link — --sys-tick stays scoped to Typography', () => {
  it('no --sys-space-* declaration references --sys-tick', () => {
    SPACING_ORDER.forEach((n) => {
      const body = readSpaceDecl(n);
      expect(referencesSysTick(body)).toBe(false);
    });
  });

  it('--sys-tick-space is NOT declared (duplication ban, Elon §Problem C)', () => {
    // Match a declaration, not a comment mention.
    expect(CSS).not.toMatch(/--sys-tick-space\s*:/);
  });
});
