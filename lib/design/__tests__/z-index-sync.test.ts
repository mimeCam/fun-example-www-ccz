/**
 * Z-Index Sync Test — CSS ↔ TS drift guard for the 8th ledger.
 *
 * Reads `app/globals.css`, parses every `--sys-z-*` declaration, asserts
 * they match the `Z` map exactly. If someone edits a number in either
 * mirror but not the other, this test fails.
 *
 * Same strategy as `motion-sync.test.ts` and `color-constants-sync.test.ts`.
 * No build step, no codegen — a plain regex read from disk at test time.
 *
 * Credits: Mike K. (napkin §7 — this test spec, plus the bijection on
 * set-membership rather than insertion order), Tanya D. (the 9-slot
 * character sheet that names what each rung *is*), Elon M. (the
 * one-name-top-to-bottom invariant locked by the helper round-trips),
 * Krystle C. (pair-rule discipline — sync without adoption is not a row).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  Z,
  Z_ORDER,
  zIndexOf,
  cssVarOf,
  classOf,
  zInvariantHolds,
} from '../z-index';

const CSS = readFileSync(resolve(__dirname, '../../../app/globals.css'), 'utf-8');

// ─── Parser helper — pure, ≤ 10 LOC ───────────────────────────────────────

/** Extract a single `--sys-z-<name>: <n>;` declaration from the CSS. */
function readZToken(name: string): number | undefined {
  const rx = new RegExp(`--sys-z-${name}:\\s*(\\d+)\\s*;`);
  const match = CSS.match(rx);
  return match ? Number(match[1]) : undefined;
}

/** Every `--sys-z-<name>` declaration in the canonical CSS — scanned once. */
const CSS_SLOTS: string[] = Array.from(
  CSS.matchAll(/--sys-z-([a-z]+)\s*:/g),
).map((m) => m[1]);

// ─── Tests ────────────────────────────────────────────────────────────────

describe('Z ↔ globals.css --sys-z-* sync', () => {
  (Object.keys(Z) as Array<keyof typeof Z>).forEach((slot) => {
    it(`Z.${slot} matches --sys-z-${slot}`, () => {
      expect(readZToken(slot)).toBe(Z[slot]);
    });
  });

  it('every --sys-z-* in CSS is represented in Z (CSS → TS)', () => {
    const tsSlots = Object.keys(Z);
    CSS_SLOTS.forEach((s) => expect(tsSlots).toContain(s));
  });

  it('every Z slot is declared in CSS (TS → CSS)', () => {
    Object.keys(Z).forEach((s) => expect(CSS_SLOTS).toContain(s));
  });
});

describe('Z structural invariants', () => {
  it('Z_ORDER is strictly ascending (back → front)', () => {
    expect(zInvariantHolds()).toBe(true);
  });

  it('Z_ORDER covers every slot exactly once', () => {
    expect([...Z_ORDER].sort()).toEqual(Object.keys(Z).sort());
  });

  it('every slot value is a positive integer', () => {
    Object.values(Z).forEach((n) => {
      expect(n).toBeGreaterThan(0);
      expect(Number.isInteger(n)).toBe(true);
    });
  });

  it('backdrop sits one integer below drawer (the modal seam)', () => {
    expect(Z.drawer - Z.backdrop).toBe(1);
  });

  it('toast is the apex slot (always above drawer + overlay)', () => {
    expect(Z.toast).toBeGreaterThan(Z.overlay);
    expect(Z.toast).toBeGreaterThan(Z.drawer);
  });
});

describe('z helpers — three mirrors round-trip from one slot name', () => {
  const SLOTS = Object.keys(Z) as Array<keyof typeof Z>;

  it('zIndexOf returns the integer for each slot', () => {
    SLOTS.forEach((s) => expect(zIndexOf(s)).toBe(Z[s]));
  });

  it('cssVarOf returns the matching CSS custom-property reference for every slot', () => {
    SLOTS.forEach((s) => expect(cssVarOf(s)).toBe(`var(--sys-z-${s})`));
  });

  it('classOf returns the matching Tailwind utility name for every slot', () => {
    SLOTS.forEach((s) => expect(classOf(s)).toBe(`z-sys-${s}`));
  });
});
