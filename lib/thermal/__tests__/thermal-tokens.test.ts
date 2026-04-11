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
  ];

  it('returns 12 CSS custom property keys', () => {
    for (const key of TOKEN_KEYS) {
      expect(SRC).toContain(`'${key}'`);
    }
  });

  it('has typography anchors matching spec', () => {
    // Line-height: 1.75 (dormant) to 1.90 (warm) — 2.4px total delta
    expect(SRC).toContain('LINE_HEIGHT');
    expect(SRC).toContain('dormant: 1.75');
    expect(SRC).toContain('warm: 1.90');
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
    expect(SRC).toContain('dormant: 0.3');
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
  it('glow returns "none" below 25% score', () => {
    expect(SRC).toContain("if (t < 0.25) return 'none'");
  });

  it('glow uses rgba(240,198,116,...) — gold color', () => {
    expect(SRC).toContain('rgba(240,198,116,');
  });

  it('shadow interpolates alpha from depth anchors', () => {
    expect(SRC).toContain('SHADOW_DEPTH.dormant');
    expect(SRC).toContain('SHADOW_DEPTH.warm');
  });
});
