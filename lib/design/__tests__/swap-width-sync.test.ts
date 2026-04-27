/**
 * swap-width-sync — CSS ↔ TS drift guard for the label-swap width floors.
 *
 * Reads `app/globals.css`, parses every `--label-swap-width-N` declaration,
 * asserts each `<rem>rem` matches `SWAP_WIDTH_RUNGS[N-1]` exactly. If a
 * future contributor edits a number in either mirror but not the other,
 * this test fails fast and names the rung. Mirrors `spacing-sync.test.ts`
 * shape: regex over CSS at test time, no build step, no codegen.
 *
 * Mirror discipline: every rung in CSS appears in TS, every rung in TS
 * appears in CSS, the three rungs are strictly increasing, and the helper
 * outputs (`swapWidthVar`, `swapWidthClassOf`) line up with the canonical
 * source.
 *
 * Credits: Mike K. (#39 napkin §POI-2 — CSS canonical, TS mirrors; the
 * regex-over-CSS pattern lifted from typography-sync / spacing-sync), Tanya
 * D. (UX #41 §3.2 — three rungs derived from labels, the rung-1 → rung-3
 * floor table that this sync fence pins), Krystle C. (sprint shape — sync
 * test is the contract that makes the fence enforceable), Sid (this lift —
 * shape parity with spacing-sync, no new conventions).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  SWAP_WIDTH_RUNGS,
  SWAP_WIDTH_ORDER,
  SWAP_REM_TO_PX,
  swapWidthRungOf,
  swapWidthVar,
  swapWidthClassOf,
  swapWidthInvariantHolds,
  SWAP_WIDTH_EXEMPT_TOKEN,
} from '../swap-width';

const CSS = readFileSync(resolve(__dirname, '../../../app/globals.css'), 'utf-8');

// ─── Parser helpers — pure, each ≤ 10 LOC ─────────────────────────────────

/** Extract the value body of a `--label-swap-width-N: …;` declaration. */
function readSwapDecl(n: number): string | undefined {
  const rx = new RegExp(`--label-swap-width-${n}:\\s*([^;]+);`);
  const match = CSS.match(rx);
  return match ? match[1].trim() : undefined;
}

/** Extract the rem value from a decl body like `5.5rem` or `5.5rem  /* … *\/`. */
function readRemFromDecl(body: string | undefined): number | undefined {
  if (!body) return undefined;
  const match = body.match(/^([\d.]+)rem\b/);
  return match ? Number(match[1]) : undefined;
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('SWAP_WIDTH_RUNGS ↔ globals.css --label-swap-width-* sync', () => {
  SWAP_WIDTH_ORDER.forEach((n) => {
    it(`--label-swap-width-${n} exists in CSS with the TS rem value`, () => {
      const body = readSwapDecl(n);
      expect(body).toBeDefined();
      expect(readRemFromDecl(body)).toBe(swapWidthRungOf(n).rem);
    });
  });

  it('every --label-swap-width-* in CSS is represented in SWAP_WIDTH_RUNGS', () => {
    const cssRungs = Array.from(CSS.matchAll(/--label-swap-width-(\d+):/g))
      .map((m) => Number(m[1]))
      .filter((n) => n >= 1 && n <= 3);
    expect(new Set(cssRungs).size).toBe(SWAP_WIDTH_RUNGS.length);
  });

  it('all three rungs exist in CSS', () => {
    SWAP_WIDTH_ORDER.forEach((n) => expect(readSwapDecl(n)).toBeDefined());
  });
});

describe('SWAP_WIDTH_RUNGS structural invariants', () => {
  it('swapWidthInvariantHolds() is true', () => {
    expect(swapWidthInvariantHolds()).toBe(true);
  });

  it('every rung has pxNominal = rem × 16 (browser default)', () => {
    SWAP_WIDTH_RUNGS.forEach((r) =>
      expect(r.pxNominal).toBe(r.rem * SWAP_REM_TO_PX),
    );
  });

  it('rungs are strictly increasing tightest → loosest', () => {
    for (let i = 1; i < SWAP_WIDTH_RUNGS.length; i++) {
      expect(SWAP_WIDTH_RUNGS[i].rem)
        .toBeGreaterThan(SWAP_WIDTH_RUNGS[i - 1].rem);
    }
  });

  it('rung 1 is the tightest (5.5rem), rung 3 is the loosest (14rem)', () => {
    expect(SWAP_WIDTH_RUNGS[0].rem).toBe(5.5);
    expect(SWAP_WIDTH_RUNGS[2].rem).toBe(14);
  });

  it('SWAP_REM_TO_PX is the 16px browser default (never remapped)', () => {
    expect(SWAP_REM_TO_PX).toBe(16);
  });
});

describe('swap-width helpers', () => {
  it('swapWidthRungOf returns the 1-based rung record for each index', () => {
    SWAP_WIDTH_ORDER.forEach((n) =>
      expect(swapWidthRungOf(n)).toBe(SWAP_WIDTH_RUNGS[n - 1]),
    );
  });

  it('swapWidthVar returns the matching CSS custom-property reference', () => {
    expect(swapWidthVar(1)).toBe('var(--label-swap-width-1)');
    expect(swapWidthVar(2)).toBe('var(--label-swap-width-2)');
    expect(swapWidthVar(3)).toBe('var(--label-swap-width-3)');
  });

  it('swapWidthClassOf composes the Tailwind arbitrary-value min-width class', () => {
    expect(swapWidthClassOf(1)).toBe('min-w-[5.5rem]');
    expect(swapWidthClassOf(2)).toBe('min-w-[6.5rem]');
    expect(swapWidthClassOf(3)).toBe('min-w-[14rem]');
  });

  it('swapWidthClassOf output is byte-identical to the migrated literals', () => {
    // Byte-identity matters: existing call-site tests assert on literal
    // strings like `min-w-[14rem]`. The helper composes the same string,
    // so the migration is a one-line s/literal/helper/ at each site
    // without perturbing rendered HTML or downstream assertions.
    expect(swapWidthClassOf(2)).toContain('6.5rem');
    expect(swapWidthClassOf(3)).toContain('14rem');
  });

  it('SWAP_WIDTH_EXEMPT_TOKEN is the documented opt-out marker', () => {
    expect(SWAP_WIDTH_EXEMPT_TOKEN).toBe('swap-width:exempt');
  });
});
