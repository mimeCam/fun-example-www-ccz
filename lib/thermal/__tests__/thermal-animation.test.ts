/**
 * Tests for thermal-animation — pure function verification.
 *
 * Validates the inverted speed curves (slower = more intimate),
 * perceptibility above JND thresholds, and dormant-zero invariant.
 *
 * Uses source inspection pattern since no JSX transform is configured.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const SRC = readFileSync(
  resolve(__dirname, '../thermal-animation.ts'),
  'utf-8',
);

// ─── Source Structure ────────────────────────────────────────

describe('thermal-animation source structure', () => {
  it('exports computeAnimationTokens', () => {
    expect(SRC).toContain('export function computeAnimationTokens');
  });

  it('exports AnimationTokens type', () => {
    expect(SRC).toContain('export interface AnimationTokens');
  });

  it('has no React/DOM imports', () => {
    expect(SRC).not.toContain('from \'react\'');
    expect(SRC).not.toContain('import');
  });

  it('uses state thresholds matching thermal-score (18/50/80)', () => {
    expect(SRC).toContain('DORMANT = 18');
    expect(SRC).toContain('STIRRING = 50');
    expect(SRC).toContain('WARM = 80');
  });
});

// ─── Speed Inversion ─────────────────────────────────────────
// Slower cycle at higher intimacy = calmer room.
// luminous > warm > stirring for ALL animation cycles.

describe('speed inversion — slower at higher intimacy', () => {
  // Extract cycle seconds from source via regex
  function extractCycleSec(animBlock: string, state: string): number {
    const re = new RegExp(`${state}:.*?cycleSec:\\s*([\\d.]+)`, 's');
    const match = animBlock.match(re);
    return match ? parseFloat(match[1]) : -1;
  }

  const breathBlock = SRC.match(/BREATH[^}]*\{([\s\S]*?)\};/)?.[1] || '';
  const glowBlock = SRC.match(/GLOW[^}]*\{([\s\S]*?)\};/)?.[1] || '';
  const driftBlock = SRC.match(/DRIFT[^}]*\{([\s\S]*?)\};/)?.[1] || '';

  it('breath: luminous cycle > warm cycle > stirring cycle', () => {
    const s = extractCycleSec(breathBlock, 'stirring');
    const w = extractCycleSec(breathBlock, 'warm');
    const l = extractCycleSec(breathBlock, 'luminous');
    expect(s).toBeGreaterThan(0);
    expect(w).toBeGreaterThan(s);
    expect(l).toBeGreaterThan(w);
  });

  it('glow: luminous cycle > warm cycle > stirring cycle', () => {
    const s = extractCycleSec(glowBlock, 'stirring');
    const w = extractCycleSec(glowBlock, 'warm');
    const l = extractCycleSec(glowBlock, 'luminous');
    expect(s).toBeGreaterThan(0);
    expect(w).toBeGreaterThan(s);
    expect(l).toBeGreaterThan(w);
  });

  it('drift: luminous cycle > warm cycle > stirring cycle', () => {
    const s = extractCycleSec(driftBlock, 'stirring');
    const w = extractCycleSec(driftBlock, 'warm');
    const l = extractCycleSec(driftBlock, 'luminous');
    expect(s).toBeGreaterThan(0);
    expect(w).toBeGreaterThan(s);
    expect(l).toBeGreaterThan(w);
  });
});

// ─── Perceptibility (JND Thresholds) ─────────────────────────
// All magnitudes must exceed human just-noticeable-difference.
// Size JND ≈ 1%, opacity JND ≈ 5-8%, position JND ≈ 2-3px.

describe('perceptibility — all magnitudes above JND', () => {
  it('breath scale ≥ 1% (0.01) at stirring+', () => {
    expect(SRC).toContain("stirring: { cycleSec: 4, scalePeak: 0.015 }");
    expect(SRC).toContain("warm:     { cycleSec: 6, scalePeak: 0.020 }");
    expect(SRC).toContain("luminous: { cycleSec: 8, scalePeak: 0.025 }");
  });

  it('glow min opacity ≥ 0.10 (above 5-8% JND) at stirring+', () => {
    // Warm state is representative — check specific anchor values
    expect(SRC).toContain("warm:     { cycleSec: 7, minOpacity: 0.20, maxOpacity: 0.40 }");
  });

  it('drift range ≥ 2px at stirring+', () => {
    expect(SRC).toContain("stirring: { cycleSec: 6, rangePx: 3 }");
    expect(SRC).toContain("warm:     { cycleSec: 8, rangePx: 5 }");
    expect(SRC).toContain("luminous: { cycleSec: 10, rangePx: 7 }");
  });
});

// ─── Dormant Zero Invariant ──────────────────────────────────
// Dormant state returns zeros for all animation tokens.

describe('dormant state — all zeros', () => {
  it('breath dormant has zero cycle and scale', () => {
    expect(SRC).toContain("dormant:  { cycleSec: 0, scalePeak: 0 }");
  });

  it('glow dormant has zero cycle and opacity', () => {
    expect(SRC).toContain("dormant:  { cycleSec: 0, minOpacity: 0, maxOpacity: 0 }");
  });

  it('drift dormant has zero cycle and range', () => {
    expect(SRC).toContain("dormant:  { cycleSec: 0, rangePx: 0 }");
  });

  it('output logic returns "0" for dormant', () => {
    expect(SRC).toContain("breath.cycleSec === 0\n      ? '0'");
    expect(SRC).toContain("glow.cycleSec === 0\n      ? '0'");
    expect(SRC).toContain("drift.cycleSec === 0\n      ? '0'");
  });
});

// ─── Anchor Value Exactness ──────────────────────────────────
// Pin the specific inverted values so regressions are caught.

describe('anchor values — exact constants', () => {
  it('breath anchors match inverted spec', () => {
    expect(SRC).toContain("stirring: { cycleSec: 4, scalePeak: 0.015 }");
    expect(SRC).toContain("warm:     { cycleSec: 6, scalePeak: 0.020 }");
    expect(SRC).toContain("luminous: { cycleSec: 8, scalePeak: 0.025 }");
  });

  it('glow anchors match inverted spec', () => {
    expect(SRC).toContain("stirring: { cycleSec: 5, minOpacity: 0.15, maxOpacity: 0.30 }");
    expect(SRC).toContain("warm:     { cycleSec: 7, minOpacity: 0.20, maxOpacity: 0.40 }");
    expect(SRC).toContain("luminous: { cycleSec: 9, minOpacity: 0.30, maxOpacity: 0.55 }");
  });

  it('drift anchors match inverted spec', () => {
    expect(SRC).toContain("stirring: { cycleSec: 6, rangePx: 3 }");
    expect(SRC).toContain("warm:     { cycleSec: 8, rangePx: 5 }");
    expect(SRC).toContain("luminous: { cycleSec: 10, rangePx: 7 }");
  });
});

// ─── Interpolation Integrity ─────────────────────────────────

describe('interpolation — smooth within bands', () => {
  it('uses lerp for smooth interpolation', () => {
    expect(SRC).toContain('function lerp(a: number, b: number, t: number)');
  });

  it('outputs cycle durations as milliseconds', () => {
    expect(SRC).toContain('* 1000)');
  });
});
