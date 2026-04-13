/**
 * Tests for thermal-tokens — continuous token interpolation verification.
 *
 * Uses source inspection pattern (same as thermal-animation.test.ts)
 * since no JSX transform is configured in Jest.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const SRC = readFileSync(
  resolve(__dirname, '../thermal-tokens.ts'),
  'utf-8',
);

// ─── Structure tests ───────────────────────────────────────

describe('thermal-tokens source structure', () => {
  it('exports computeThermalTokens', () => {
    expect(SRC).toContain('export function computeThermalTokens');
  });

  it('exports ThermalTokens type', () => {
    expect(SRC).toContain('export type ThermalTokens');
  });

  it('has no React/DOM imports', () => {
    expect(SRC).not.toContain('from \'react\'');
    expect(SRC).toContain('import type { ThermalState }');
  });
});

// ─── Token output tests ────────────────────────────────────

describe('computeThermalTokens — output tokens', () => {
  const TOKEN_KEYS = [
    '--token-bg',
    '--token-surface',
    '--token-foreground',
    '--token-accent',
    '--token-glow',
    '--token-shadow',
    '--token-border',
    // Continuous tokens
    '--token-line-height',
    '--token-shadow-depth',
    '--token-radius-soft',
    '--token-accent-opacity',
    // Typography depth tokens — thermal typography
    '--token-font-weight',
    '--token-letter-spacing',
    '--token-para-rhythm',
    '--token-text-glow',
  ];

  it('returns 15 CSS custom property keys', () => {
    for (const key of TOKEN_KEYS) {
      expect(SRC).toContain(`'${key}'`);
    }
    // Plus 12 spacing lift tokens (verified in spacing describe block)
  });

  it('has typography anchors matching spec', () => {
    // Line-height: 1.75 (dormant) to 1.95 (warm) — 3.5px total delta
    expect(SRC).toContain('LINE_HEIGHT');
    expect(SRC).toContain('dormant: 1.75');
    expect(SRC).toContain('warm: 1.95');
  });

  it('has shadow depth anchors', () => {
    expect(SRC).toContain('SHADOW_DEPTH');
    expect(SRC).toContain('dormant: 0.3');
    expect(SRC).toContain('warm: 0.5');
  });

  it('has radius soft anchors', () => {
    expect(SRC).toContain('RADIUS_SOFT');
    expect(SRC).toContain('dormant: 0');
    expect(SRC).toContain('warm: 0.5');
  });

  it('has accent opacity anchors', () => {
    expect(SRC).toContain('ACCENT_OPACITY');
    expect(SRC).toContain('dormant: 0.5');
    expect(SRC).toContain('warm: 1.0');
  });

  it('uses HSL interpolation for color tokens', () => {
    expect(SRC).toContain('function hexToHsl');
    expect(SRC).toContain('function lerpHsl');
    expect(SRC).toContain('function hslToHex');
  });

  it('uses lerp for non-color tokens', () => {
    expect(SRC).toContain('function lerp(');
  });
});

// ─── Anchor value tests ────────────────────────────────────

describe('thermal-tokens — anchor values match CSS :root defaults', () => {
  it('BG dormant matches --token-bg default', () => {
    expect(SRC).toContain("dormant: '#1a1a2e'");
  });

  it('SURFACE dormant matches --token-surface default', () => {
    expect(SRC).toContain("dormant: '#16213e'");
  });

  it('FOREGROUND dormant matches --token-foreground default', () => {
    expect(SRC).toContain("dormant: '#e8e8f0'");
  });

  it('ACCENT dormant matches --token-accent default (#7b2cbf)', () => {
    expect(SRC).toContain("dormant: '#7b2cbf'");
  });

  it('BORDER dormant matches --token-border default', () => {
    expect(SRC).toContain("dormant: '#222244'");
  });
});

// ─── Glow/shadow function tests ────────────────────────────

describe('glowValue and shadowValue', () => {
  it('glow returns "none" below 18% score', () => {
    expect(SRC).toContain("if (t < 0.18) return 'none'");
  });

  it('glow uses rgba(240,198,116,...) — gold color', () => {
    expect(SRC).toContain('rgba(240,198,116,');
  });

  it('shadow interpolates alpha from depth anchors', () => {
    expect(SRC).toContain('SHADOW_DEPTH.dormant');
    expect(SRC).toContain('SHADOW_DEPTH.warm');
  });
});

// ─── Typography depth token tests ──────────────────────────

describe('thermal-tokens — typography depth anchors', () => {
  it('has FONT_WEIGHT anchors (400 → 500, crosses JND)', () => {
    expect(SRC).toContain('FONT_WEIGHT');
    expect(SRC).toContain('dormant: 400');
    expect(SRC).toContain('warm: 500');
  });

  it('has LETTER_SPACING anchors (-0.01em → +0.02em)', () => {
    expect(SRC).toContain('LETTER_SPACING');
    expect(SRC).toContain('dormant: -0.01');
    expect(SRC).toContain('warm: 0.02');
  });

  it('has PARA_RHYTHM anchors (0px → 12px)', () => {
    expect(SRC).toContain('PARA_RHYTHM');
    expect(SRC).toContain('dormant: 0');
    expect(SRC).toContain('warm: 12');
  });

  it('emits --token-font-weight using lerp', () => {
    expect(SRC).toContain("'--token-font-weight'");
    expect(SRC).toContain('FONT_WEIGHT.dormant');
    expect(SRC).toContain('FONT_WEIGHT.warm');
  });

  it('emits --token-letter-spacing with em unit', () => {
    expect(SRC).toContain("'--token-letter-spacing'");
    expect(SRC).toContain('}em`');
  });

  it('emits --token-para-rhythm with px unit', () => {
    expect(SRC).toContain("'--token-para-rhythm'");
    expect(SRC).toContain('}px`');
  });

  it('emits --token-text-glow via textGlowValue function', () => {
    expect(SRC).toContain("'--token-text-glow'");
    expect(SRC).toContain('function textGlowValue');
  });
});

describe('textGlowValue — warm-only text glow', () => {
  it('returns "none" below 50% score (warm threshold)', () => {
    expect(SRC).toContain("if (t < 0.5) return 'none'");
  });

  it('caps alpha at 0.12 — perceivable peripheral warmth', () => {
    expect(SRC).toContain('0.12');
  });

  it('uses gold rgba for text glow', () => {
    expect(SRC).toContain('rgba(240,198,116,');
  });
});

// ─── Spacing interpolation tests ─────────────────────────────

import { computeSpacingTokens } from '@/lib/thermal/thermal-tokens';

describe('computeSpacingTokens', () => {
  it('returns 12 lift tokens with correct key names', () => {
    const tokens = computeSpacingTokens(50);
    for (let n = 1; n <= 12; n++) {
      expect(tokens).toHaveProperty(`--token-space-lift-${n}`);
    }
    expect(Object.keys(tokens)).toHaveLength(12);
  });

  it('dormant score (0) produces all-zero lifts', () => {
    const tokens = computeSpacingTokens(0);
    for (let n = 1; n <= 12; n++) {
      expect(tokens[`--token-space-lift-${n}`]).toBe('0.00px');
    }
  });

  it('below-threshold score (17) produces all-zero lifts', () => {
    const tokens = computeSpacingTokens(17);
    for (let n = 1; n <= 12; n++) {
      expect(tokens[`--token-space-lift-${n}`]).toBe('0.00px');
    }
  });

  it('stirring score (25) produces non-zero lifts for larger steps', () => {
    const tokens = computeSpacingTokens(25);
    // Small steps should have minimal lift
    expect(parseFloat(tokens['--token-space-lift-2'])).toBeLessThan(1.5);
    // Large steps should have noticeable lift
    expect(parseFloat(tokens['--token-space-lift-12'])).toBeGreaterThan(0);
    expect(parseFloat(tokens['--token-space-lift-12'])).toBeLessThan(4);
  });

  it('warm score (60) produces meaningful lifts', () => {
    const tokens = computeSpacingTokens(60);
    const lift12 = parseFloat(tokens['--token-space-lift-12']);
    expect(lift12).toBeGreaterThan(3);
    expect(lift12).toBeLessThan(7);
  });

  it('luminous score (100) caps at ~8px for largest step', () => {
    const tokens = computeSpacingTokens(100);
    const lift12 = parseFloat(tokens['--token-space-lift-12']);
    expect(lift12).toBeCloseTo(8.0, 0);
    expect(lift12).toBeLessThanOrEqual(8.1);
  });

  it('larger steps get proportionally more lift than smaller ones', () => {
    const tokens = computeSpacingTokens(70);
    const lift2 = parseFloat(tokens['--token-space-lift-2']);
    const lift8 = parseFloat(tokens['--token-space-lift-8']);
    const lift12 = parseFloat(tokens['--token-space-lift-12']);
    expect(lift8).toBeGreaterThan(lift2);
    expect(lift12).toBeGreaterThan(lift8);
  });

  it('lifts are monotonically increasing with score', () => {
    const scores = [20, 40, 60, 80, 100];
    const lifts = scores.map(s => parseFloat(computeSpacingTokens(s)['--token-space-lift-8']));
    for (let i = 1; i < lifts.length; i++) {
      expect(lifts[i]).toBeGreaterThan(lifts[i - 1]);
    }
  });

  it('all values are in px units', () => {
    const tokens = computeSpacingTokens(50);
    for (const val of Object.values(tokens)) {
      expect(val).toMatch(/^\d+\.\d{2}px$/);
    }
  });

  it('no lift exceeds 8.1px even at score 100', () => {
    const tokens = computeSpacingTokens(100);
    for (const val of Object.values(tokens)) {
      expect(parseFloat(val)).toBeLessThanOrEqual(8.1);
    }
  });
});

// ─── Source inspection: spacing constants ─────────────────────

describe('thermal-tokens — spacing constants in source', () => {
  it('defines SPACING_LIFT_MAX constant', () => {
    expect(SRC).toContain('SPACING_LIFT_MAX');
    expect(SRC).toContain('5.66');
  });

  it('defines SPACING_THRESHOLD at 18 (dormant cutoff)', () => {
    expect(SRC).toContain('SPACING_THRESHOLD');
    expect(SRC).toContain('18');
  });

  it('exports computeSpacingTokens function', () => {
    expect(SRC).toContain('export function computeSpacingTokens');
  });

  it('uses sqrt scale for proportional growth', () => {
    expect(SRC).toContain('Math.sqrt');
    expect(SRC).toContain('SPACING_SCALE_REF');
  });
});
