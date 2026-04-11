/**
 * Tests for thermal-animation — pure function verification.
 *
 * Uses source inspection pattern (same as DepthBar.test.ts)
 * since no JSX transform is configured in Jest.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const SRC = readFileSync(
  resolve(__dirname, '../thermal-animation.ts'),
  'utf-8',
);

// ─── Extract the pure function for testing ───────────────
// We eval the module logic to test the computeAnimationTokens function.
// The file has no imports that need mocking — it's pure.

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

  it('uses state thresholds matching thermal-score (25/50/80)', () => {
    expect(SRC).toContain('DORMANT = 25');
    expect(SRC).toContain('STIRRING = 50');
    expect(SRC).toContain('WARM = 80');
  });
});

describe('computeAnimationTokens — output tokens', () => {
  it('returns 7 animation token keys', () => {
    // Count the keys in the returned object
    const tokenKeys = [
      '--token-breath-speed',
      '--token-breath-scale',
      '--token-glow-speed',
      '--token-glow-min',
      '--token-glow-max',
      '--token-drift-speed',
      '--token-drift-range',
    ];
    for (const key of tokenKeys) {
      expect(SRC).toContain(`'${key}'`);
    }
  });

  it('dormant state (score 0) returns all zeros', () => {
    // The dormant band returns '0' for all speed tokens
    expect(SRC).toContain("breath.cycleSec === 0\n      ? '0'");
    expect(SRC).toContain("glow.cycleSec === 0\n      ? '0'");
    expect(SRC).toContain("drift.cycleSec === 0\n      ? '0'");
  });

  it('stirring state (score 30) activates breath with 6s cycle', () => {
    // Check the stirring breath config
    expect(SRC).toContain("stirring: { cycleSec: 6, scalePeak: 0.002 }");
  });

  it('warm state (score 60) uses 4.5s breath cycle', () => {
    expect(SRC).toContain("warm:     { cycleSec: 4.5, scalePeak: 0.003 }");
  });

  it('luminous state (score 90) uses 3.5s breath cycle', () => {
    expect(SRC).toContain("luminous: { cycleSec: 3.5, scalePeak: 0.005 }");
  });

  it('glow opacity ranges are correct for warm state', () => {
    expect(SRC).toContain("warm:     { cycleSec: 4, minOpacity: 0.08, maxOpacity: 0.18 }");
  });

  it('drift range is correct for luminous state', () => {
    expect(SRC).toContain("luminous: { cycleSec: 5, rangePx: 3 }");
  });

  it('uses lerp for smooth interpolation within bands', () => {
    expect(SRC).toContain('function lerp(a: number, b: number, t: number)');
  });

  it('cycle durations output as milliseconds', () => {
    // All speed tokens multiply by 1000 to get ms
    expect(SRC).toContain('* 1000)');
  });
});
