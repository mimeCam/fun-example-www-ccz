/**
 * hue — property tests for the palette-geometry kernel.
 *
 * Five mathematical promises the rest of the project leans on:
 *
 *   1. `hexToRgb01` round-trips: every parsed channel sits in [0, 1] and
 *      survives a `* 255 | 0` shim back to its hex byte (the contrast
 *      module's `hexToRgb` flavour). Unit drift fails here, not in a
 *      WCAG audit at the bottom of CI.
 *   2. `hexToRgb255` is `hexToRgb01` × 255 (rounded). Two units, one
 *      kernel — the canonical 0..1 form is the source.
 *   3. `hexToHsl` returns h in [0, 360), s/l in [0, 1]. Greyscale inputs
 *      pin h=0, s=0 (the conventional choice; matches `lerpHsl` at
 *      `lib/thermal/thermal-tokens.ts:92`).
 *   4. `circularHueDelta` survives the 0°/360° wrap and is symmetric:
 *      `Δh(a, b) === Δh(b, a)`; `Δh(0, 360) === 0`; `Δh(350, 10) === 20`.
 *      Always lands in [0, 180].
 *   5. Real palette anchors (`THERMAL.accent`, `THERMAL_WARM.accent`,
 *      `BRAND.accentViolet`) parse without throwing — the kernel handles
 *      the project's actual hex vocabulary, not just toy inputs.
 *
 * Pure Jest. No DOM, no Canvas, no Tailwind. Numbers, not adjectives.
 *
 * Credits: Mike K. (napkin — property tests on the kernel before the
 * audit lands), Elon M. (#54 §3 — unit-drift teardown the round-trip
 * test pins), Jason F. ("same wheel" — Δh property tests are the wheel's
 * arithmetic surfaced).
 */

import {
  hexToRgb01,
  hexToRgb255,
  hexToHsl,
  circularHueDelta,
  oklchDeltaE,
} from '../hue';
import { BRAND, THERMAL, THERMAL_WARM, ARCHETYPE } from '../color-constants';

// ─── 1 · hexToRgb01 — kernel sanity ──────────────────────────────────────

describe('hue · hexToRgb01 — channels in [0, 1]', () => {
  it('parses #000000 → [0, 0, 0]', () => {
    expect(hexToRgb01('#000000')).toEqual([0, 0, 0]);
  });

  it('parses #ffffff → [1, 1, 1]', () => {
    expect(hexToRgb01('#ffffff')).toEqual([1, 1, 1]);
  });

  it('accepts hex without leading hash', () => {
    expect(hexToRgb01('7b2cbf')).toEqual(hexToRgb01('#7b2cbf'));
  });

  it('every channel sits in [0, 1] for a sweep', () => {
    for (const hex of ['#1a1a2e', '#382238', '#7b2cbf', '#f0c674', '#c77dff']) {
      const [r, g, b] = hexToRgb01(hex);
      for (const c of [r, g, b]) expect(c).toBeGreaterThanOrEqual(0);
      for (const c of [r, g, b]) expect(c).toBeLessThanOrEqual(1);
    }
  });

  it('throws on malformed hex (kernel is strict, not best-effort)', () => {
    expect(() => hexToRgb01('not-a-hex')).toThrow(/bad hex/);
    expect(() => hexToRgb01('#fff')).toThrow(/bad hex/);
  });
});

// ─── 2 · hexToRgb255 — shim consistency ──────────────────────────────────

describe('hue · hexToRgb255 — shim over hexToRgb01', () => {
  it.each([
    '#000000', '#ffffff', '#1a1a2e', '#7b2cbf', '#f0c674', '#c77dff',
  ])('matches hexToRgb01(x) * 255 (rounded) for %s', (hex) => {
    const [r01, g01, b01] = hexToRgb01(hex);
    const [r, g, b] = hexToRgb255(hex);
    expect(r).toBe(Math.round(r01 * 255));
    expect(g).toBe(Math.round(g01 * 255));
    expect(b).toBe(Math.round(b01 * 255));
  });
});

// ─── 3 · hexToHsl — channel ranges ──────────────────────────────────────

describe('hue · hexToHsl — h in [0,360), s/l in [0,1]', () => {
  it('greyscale → h=0, s=0', () => {
    const grey = hexToHsl('#7f7f7f');
    expect(grey.h).toBe(0);
    expect(grey.s).toBe(0);
  });

  it('every cell sits in its declared range for a sweep', () => {
    for (const hex of ['#1a1a2e', '#382238', '#7b2cbf', '#f0c674', '#c77dff']) {
      const { h, s, l } = hexToHsl(hex);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(360);
      for (const c of [s, l]) expect(c).toBeGreaterThanOrEqual(0);
      for (const c of [s, l]) expect(c).toBeLessThanOrEqual(1);
    }
  });

  it('THERMAL.accent (violet) lands in the violet band (h ∈ [270, 290])', () => {
    const { h } = hexToHsl(THERMAL.accent);
    expect(h).toBeGreaterThanOrEqual(270);
    expect(h).toBeLessThanOrEqual(290);
  });

  it('THERMAL_WARM.accent (gold) lands in the yellow band (h ∈ [35, 55])', () => {
    // `#f0c674` measures ~39.68° — gold-yellow, just shy of 40°.
    const { h } = hexToHsl(THERMAL_WARM.accent);
    expect(h).toBeGreaterThanOrEqual(35);
    expect(h).toBeLessThanOrEqual(55);
  });
});

// ─── 4 · circularHueDelta — wrap-safe, symmetric, bounded ───────────────

describe('hue · circularHueDelta — survives the 0°/360° wrap', () => {
  it('identity → 0', () => {
    expect(circularHueDelta(120, 120)).toBe(0);
  });

  it('0 vs 360 → 0 (wrap)', () => {
    expect(circularHueDelta(0, 360)).toBe(0);
  });

  it('350 vs 10 → 20 (the canonical wrap test)', () => {
    expect(circularHueDelta(350, 10)).toBe(20);
  });

  it('symmetric: Δh(a, b) === Δh(b, a)', () => {
    for (const [a, b] of [[10, 350], [60, 240], [123, 45]]) {
      expect(circularHueDelta(a, b)).toBe(circularHueDelta(b, a));
    }
  });

  it('bounded: every Δh ∈ [0, 180]', () => {
    for (const [a, b] of [[0, 0], [0, 180], [10, 350], [60, 240]]) {
      const d = circularHueDelta(a, b);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(180);
    }
  });

  it('opposite hues → 180 (the wheel diameter)', () => {
    expect(circularHueDelta(0, 180)).toBe(180);
    expect(circularHueDelta(90, 270)).toBe(180);
  });
});

// ─── 5 · Real palette anchors parse without throwing ────────────────────

describe('hue · the project palette parses cleanly', () => {
  const ANCHORS = [
    ...Object.values(THERMAL),
    ...Object.values(THERMAL_WARM),
    ...Object.values(BRAND),
    ...Object.values(ARCHETYPE),
  ];

  it.each(ANCHORS)('hexToRgb01(%s) does not throw', (hex) => {
    expect(() => hexToRgb01(hex)).not.toThrow();
  });

  it.each(ANCHORS)('hexToHsl(%s) does not throw', (hex) => {
    expect(() => hexToHsl(hex)).not.toThrow();
  });
});

// ─── 6 · oklchDeltaE — perceptual sibling to circularHueDelta ────────────
//
// The eyeball, sibling to the wheel (Mike napkin POI #5 / Tanya UX §3.2 /
// Elon §6). Promoted to a binding dual-axis gate alongside `circularHueDelta`
// — the three sibling-voice audits (`archetype-`/`worldview-`/`textlink-
// passage-hue-distance`) call it through `lib/design/hue-distance.ts`. The
// properties below pin its kernel-level invariants — identity, symmetry,
// non-negativity — so the gate above stands on first principles, not vibes.

describe('hue · oklchDeltaE — perceptual property tests', () => {
  it('identity → 0 (any hex is zero distance from itself)', () => {
    for (const hex of ['#000000', '#ffffff', '#dc6cff', '#bc8cf0']) {
      expect(oklchDeltaE(hex, hex)).toBeCloseTo(0, 6);
    }
  });

  it('symmetric: oklchDeltaE(a, b) === oklchDeltaE(b, a)', () => {
    const a = '#dc6cff', b = '#bc8cf0';
    expect(oklchDeltaE(a, b)).toBeCloseTo(oklchDeltaE(b, a), 8);
  });

  it('non-negative (Euclidean distance is unsigned)', () => {
    for (const [a, b] of [['#000000', '#ffffff'], ['#dc6cff', '#bc8cf0']]) {
      expect(oklchDeltaE(a, b)).toBeGreaterThanOrEqual(0);
    }
  });

  it('post-lift sibling violets clear the ≥ 5 perceptual gate (Tanya UX §3.2)', () => {
    // BRAND.accentViolet (#dc6cff) ↔ BRAND.secondary (#bc8cf0). Pre-lift
    // sat at ≈ 4.61; post-lift reads ≈ 8.74. The gate is the eyeball check
    // Tanya UX §3.2 named non-negotiable; the audit is HSL Δh on the wheel.
    const dE = oklchDeltaE(BRAND.accentViolet, BRAND.secondary);
    expect(dE).toBeGreaterThanOrEqual(5);
  });
});
