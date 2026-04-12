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
    '--token-spacing-breath',
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

  it('returns 16 CSS custom property keys', () => {
    for (const key of TOKEN_KEYS) {
      expect(SRC).toContain(`'${key}'`);
    }
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
  it('has FONT_WEIGHT anchors (400 → 420, one grade shift)', () => {
    expect(SRC).toContain('FONT_WEIGHT');
    expect(SRC).toContain('dormant: 400');
    expect(SRC).toContain('warm: 420');
  });

  it('has LETTER_SPACING anchors (-0.01em → +0.01em)', () => {
    expect(SRC).toContain('LETTER_SPACING');
    expect(SRC).toContain('dormant: -0.01');
    expect(SRC).toContain('warm: 0.01');
  });

  it('has PARA_RHYTHM anchors (0px → 6px)', () => {
    expect(SRC).toContain('PARA_RHYTHM');
    expect(SRC).toContain('dormant: 0');
    expect(SRC).toContain('warm: 6');
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

  it('caps alpha at 0.05 — peripheral warmth', () => {
    expect(SRC).toContain('0.05');
  });

  it('uses gold rgba for text glow', () => {
    expect(SRC).toContain('rgba(240,198,116,');
  });
});
