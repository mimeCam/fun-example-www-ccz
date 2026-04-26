/**
 * Color Constants Sync Test
 * Verifies that lib/design/color-constants.ts stays in sync with
 * globals.css :root definitions and thermal-tokens.ts anchor values.
 *
 * If this test fails, someone changed a color in one place but not the other.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { THERMAL, THERMAL_WARM, BRAND, ARCHETYPE } from '../color-constants';

const CSS = readFileSync(resolve(__dirname, '../../../app/globals.css'), 'utf-8');
const TOKENS_SRC = readFileSync(resolve(__dirname, '../../thermal/thermal-tokens.ts'), 'utf-8');

describe('color-constants ↔ globals.css sync', () => {
  it('THERMAL.bg matches --token-bg default', () => {
    expect(CSS).toContain(`--token-bg: ${THERMAL.bg}`);
  });

  it('THERMAL.surface matches --token-surface default', () => {
    expect(CSS).toContain(`--token-surface: ${THERMAL.surface}`);
  });

  it('THERMAL.foreground matches --token-foreground default', () => {
    expect(CSS).toContain(`--token-foreground: ${THERMAL.foreground}`);
  });

  it('THERMAL.accent matches --token-accent default', () => {
    expect(CSS).toContain(`--token-accent: ${THERMAL.accent}`);
  });

  it('THERMAL.border matches --token-border default', () => {
    expect(CSS).toContain(`--token-border: ${THERMAL.border}`);
  });

  it('BRAND.gold matches --gold', () => {
    expect(CSS).toContain(`--gold: ${BRAND.gold}`);
  });

  it('BRAND.mist matches --mist', () => {
    expect(CSS).toContain(`--mist: ${BRAND.mist}`);
  });

  it('BRAND.fog matches --fog', () => {
    expect(CSS).toContain(`--fog: ${BRAND.fog}`);
  });

  it('BRAND.rose matches --rose', () => {
    expect(CSS).toContain(`--rose: ${BRAND.rose}`);
  });

  it('BRAND.cyan matches --cyan', () => {
    expect(CSS).toContain(`--cyan: ${BRAND.cyan}`);
  });

  it('BRAND.accentViolet matches --accent-violet (Tailwind text-accent painter)', () => {
    expect(CSS).toContain(`--accent-violet: ${BRAND.accentViolet}`);
  });
});

describe('color-constants ↔ thermal-tokens.ts anchor sync', () => {
  it('THERMAL.bg matches BG dormant anchor', () => {
    expect(TOKENS_SRC).toContain(`dormant: '${THERMAL.bg}'`);
  });

  it('THERMAL.surface matches SURFACE dormant anchor', () => {
    expect(TOKENS_SRC).toContain(`dormant: '${THERMAL.surface}'`);
  });

  it('THERMAL.foreground matches FOREGROUND dormant anchor', () => {
    expect(TOKENS_SRC).toContain(`dormant: '${THERMAL.foreground}'`);
  });

  it('THERMAL.accent matches ACCENT dormant anchor', () => {
    expect(TOKENS_SRC).toContain(`dormant: '${THERMAL.accent}'`);
  });

  it('THERMAL.border matches BORDER dormant anchor', () => {
    expect(TOKENS_SRC).toContain(`dormant: '${THERMAL.border}'`);
  });
});

describe('color-constants ↔ globals.css archetype sync', () => {
  it('ARCHETYPE deep-diver matches --arch-deep-diver', () => {
    expect(CSS).toContain(`--arch-deep-diver: ${ARCHETYPE['deep-diver']}`);
  });

  it('ARCHETYPE explorer matches --arch-explorer', () => {
    expect(CSS).toContain(`--arch-explorer: ${ARCHETYPE['explorer']}`);
  });

  it('ARCHETYPE faithful matches --arch-faithful', () => {
    expect(CSS).toContain(`--arch-faithful: ${ARCHETYPE['faithful']}`);
  });

  it('ARCHETYPE resonator matches --arch-resonator', () => {
    expect(CSS).toContain(`--arch-resonator: ${ARCHETYPE['resonator']}`);
  });

  it('ARCHETYPE collector matches --arch-collector', () => {
    expect(CSS).toContain(`--arch-collector: ${ARCHETYPE['collector']}`);
  });
});

describe('color-constants structure', () => {
  it('exports all 5 archetype colors', () => {
    const keys = Object.keys(ARCHETYPE);
    expect(keys).toHaveLength(5);
    expect(keys).toContain('deep-diver');
    expect(keys).toContain('explorer');
    expect(keys).toContain('faithful');
    expect(keys).toContain('resonator');
    expect(keys).toContain('collector');
  });

  it('exports all thermal dormant anchors', () => {
    expect(THERMAL).toHaveProperty('bg');
    expect(THERMAL).toHaveProperty('surface');
    expect(THERMAL).toHaveProperty('foreground');
    expect(THERMAL).toHaveProperty('accent');
    expect(THERMAL).toHaveProperty('border');
  });

  it('exports all brand tokens', () => {
    expect(BRAND).toHaveProperty('gold');
    expect(BRAND).toHaveProperty('mist');
    expect(BRAND).toHaveProperty('fog');
    expect(BRAND).toHaveProperty('rose');
    expect(BRAND).toHaveProperty('cyan');
    expect(BRAND).toHaveProperty('accentViolet');
  });

  it('cssOr returns fallback when document is unavailable', () => {
    const { cssOr } = require('../color-constants');
    // In test env, document is undefined — should return fallback
    expect(cssOr('--gold', '#f0c674')).toBe('#f0c674');
  });
});
