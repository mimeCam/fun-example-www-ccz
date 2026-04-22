/**
 * Elevation Sync Test — CSS ↔ TS drift guard.
 *
 * Reads `app/globals.css`, parses every `--sys-elev-*` declaration, asserts
 * they match `ELEVATION` exactly. If someone edits a value in either mirror
 * but not the other, this test fails fast and names the beat.
 *
 * Mirrors the strategy of `motion-sync.test.ts` and
 * `color-constants-sync.test.ts`. No build step, no codegen — a plain
 * regex read from disk at test time.
 *
 * Credits: Mike K. (napkin §6 — module shape + this sync-test pattern,
 * lifted from motion.ts), Tanya D. (the depth/glow split locked here),
 * Krystle C. (original ledger sprint shape), Jason F. (the `occlusion()`
 * graft — tested below).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  ELEVATION,
  ELEVATION_ORDER,
  DEPTH_BEATS,
  GLOW_BEATS,
  shadowOf,
  cssVarOf,
  isDepth,
  isGlow,
  occlusion,
  depthModulated,
  elevationInvariantHolds,
} from '../elevation';

const CSS = readFileSync(resolve(__dirname, '../../../app/globals.css'), 'utf-8');

// ─── Parser helpers — pure, each ≤ 10 LOC ─────────────────────────────────

/** Extract a single `--sys-elev-<name>: <value>;` declaration from the CSS. */
function readElevToken(name: string): string | undefined {
  const rx = new RegExp(`--sys-elev-${name}:\\s*([^;]+);`);
  const match = CSS.match(rx);
  return match ? match[1].trim() : undefined;
}

/** Normalise whitespace so multi-space CSS aligns with single-space TS. */
function normalise(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('ELEVATION ↔ globals.css --sys-elev-* sync', () => {
  (Object.keys(ELEVATION) as Array<keyof typeof ELEVATION>).forEach((beat) => {
    it(`ELEVATION.${beat} matches --sys-elev-${beat}`, () => {
      const css = readElevToken(beat);
      expect(css).toBeDefined();
      expect(normalise(css!)).toBe(normalise(ELEVATION[beat]));
    });
  });

  it('every --sys-elev-* in CSS is represented in ELEVATION', () => {
    const cssBeats = Array.from(CSS.matchAll(/--sys-elev-([a-z]+):/g)).map((m) => m[1]);
    const tsBeats = Object.keys(ELEVATION);
    cssBeats.forEach((b) => expect(tsBeats).toContain(b));
  });

  it('all six tokens exist in CSS', () => {
    ELEVATION_ORDER.forEach((b) => expect(readElevToken(b)).toBeDefined());
  });
});

describe('ELEVATION structural invariants', () => {
  it('elevationInvariantHolds() is true', () => {
    expect(elevationInvariantHolds()).toBe(true);
  });

  it('depth + glow families partition the six beats with no overlap', () => {
    const overlap = DEPTH_BEATS.filter((b) => GLOW_BEATS.includes(b));
    expect(overlap).toEqual([]);
    expect(DEPTH_BEATS.length + GLOW_BEATS.length).toBe(ELEVATION_ORDER.length);
  });

  it('rest is the only "none" beat', () => {
    expect(ELEVATION.rest).toBe('none');
    ELEVATION_ORDER.filter((b) => b !== 'rest').forEach((b) => {
      expect(ELEVATION[b]).not.toBe('none');
    });
  });

  it('depth beats use rgba black; glow beats use color-mix gold', () => {
    DEPTH_BEATS.filter((b) => b !== 'rest').forEach((b) => {
      expect(ELEVATION[b]).toContain('rgba(0,0,0');
    });
    GLOW_BEATS.forEach((b) => {
      expect(ELEVATION[b]).toContain('color-mix');
      expect(ELEVATION[b]).toContain('--gold');
    });
  });
});

describe('elevation helpers', () => {
  it('shadowOf returns the raw value for each beat', () => {
    ELEVATION_ORDER.forEach((b) => expect(shadowOf(b)).toBe(ELEVATION[b]));
  });

  it('cssVarOf returns the matching CSS custom-property reference', () => {
    expect(cssVarOf('rest')).toBe('var(--sys-elev-rest)');
    expect(cssVarOf('radiance')).toBe('var(--sys-elev-radiance)');
  });

  it('isDepth / isGlow classify each beat exclusively', () => {
    DEPTH_BEATS.forEach((b) => {
      expect(isDepth(b)).toBe(true);
      expect(isGlow(b)).toBe(false);
    });
    GLOW_BEATS.forEach((b) => {
      expect(isGlow(b)).toBe(true);
      expect(isDepth(b)).toBe(false);
    });
  });
});

describe('occlusion modifier (Jason graft)', () => {
  it('distance=0 returns the unmodified css var ref', () => {
    expect(occlusion('bloom', 0)).toBe('var(--sys-elev-bloom)');
  });

  it('distance=1 returns full-transparent (0%)', () => {
    expect(occlusion('bloom', 1)).toContain('0%');
    expect(occlusion('bloom', 1)).toContain('transparent');
  });

  it('distance=0.5 returns ~50% intensity color-mix', () => {
    const out = occlusion('bloom', 0.5);
    expect(out).toContain('var(--sys-elev-bloom) 50%');
  });

  it('clamps out-of-range distances', () => {
    expect(occlusion('bloom', -1)).toBe(occlusion('bloom', 0));
    expect(occlusion('bloom', 99)).toBe(occlusion('bloom', 1));
  });
});

describe('depthModulated alias (Tanya 3-arg form)', () => {
  it('t=1, distance=0 reduces to occlusion(beat, 0) — full beat', () => {
    expect(depthModulated('bloom', 0, 1)).toBe(occlusion('bloom', 0));
  });

  it('t=0.33, distance=0 maps to ~67% dim (subtle ceremony tier)', () => {
    const out = depthModulated('bloom', 0, 0.33);
    expect(out).toContain('color-mix');
  });

  it('clamps t and distance to [0..1]', () => {
    expect(() => depthModulated('bloom', -5, 99)).not.toThrow();
  });
});
