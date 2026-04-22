/**
 * Motion Sync Test — CSS ↔ TS drift guard.
 *
 * Reads `app/globals.css`, parses every `--sys-time-*` and `--sys-ease-*`
 * declaration, asserts they match `MOTION` / `EASE` exactly. If someone
 * edits a number in either mirror but not the other, this test fails.
 *
 * Same strategy as `color-constants-sync.test.ts`. No build step, no
 * codegen — a plain regex read from disk at test time.
 *
 * Credits: Mike K. (napkin §7 — this test spec), Tanya D. (eight-beat
 * vocabulary including `crossfade`), Elon M. (drift-bug catches).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  MOTION,
  EASE,
  MOTION_REDUCED_MS,
  CEREMONY,
  msOf,
  cssVarOf,
  motionInvariantHolds,
} from '../motion';

const CSS = readFileSync(resolve(__dirname, '../../../app/globals.css'), 'utf-8');

// ─── Parser helpers — pure, each ≤ 10 LOC ─────────────────────────────────

/** Extract a single `--sys-time-<name>: <n>ms` declaration from the CSS. */
function readTimeToken(name: string): number | undefined {
  const rx = new RegExp(`--sys-time-${name}:\\s*(\\d+)ms`);
  const match = CSS.match(rx);
  return match ? Number(match[1]) : undefined;
}

/** Extract a single `--sys-ease-<name>: <value>` declaration from the CSS. */
function readEaseToken(name: string): string | undefined {
  const rx = new RegExp(`--sys-ease-${name}:\\s*([^;]+);`);
  const match = CSS.match(rx);
  return match ? match[1].trim() : undefined;
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('MOTION ↔ globals.css --sys-time-* sync', () => {
  (Object.keys(MOTION) as Array<keyof typeof MOTION>).forEach((beat) => {
    it(`MOTION.${beat} matches --sys-time-${beat}`, () => {
      expect(readTimeToken(beat)).toBe(MOTION[beat]);
    });
  });

  it('every --sys-time-* in CSS is represented in MOTION', () => {
    const cssBeats = Array.from(CSS.matchAll(/--sys-time-([a-z]+):/g)).map((m) => m[1]);
    const tsBeats = Object.keys(MOTION);
    cssBeats.forEach((b) => expect(tsBeats).toContain(b));
  });
});

describe('EASE ↔ globals.css --sys-ease-* sync', () => {
  (Object.keys(EASE) as Array<keyof typeof EASE>).forEach((curve) => {
    it(`EASE.${curve} matches --sys-ease-${curve}`, () => {
      expect(readEaseToken(curve)).toBe(EASE[curve]);
    });
  });
});

describe('MOTION structural invariants', () => {
  it('beats are strictly ascending (fastest → slowest)', () => {
    expect(motionInvariantHolds()).toBe(true);
  });

  it('MOTION_REDUCED_MS is below the fastest beat', () => {
    const fastest = Math.min(...Object.values(MOTION));
    expect(MOTION_REDUCED_MS).toBeGreaterThan(0);
    expect(MOTION_REDUCED_MS).toBeLessThan(fastest);
  });

  it('every beat is a positive integer', () => {
    Object.values(MOTION).forEach((n) => {
      expect(n).toBeGreaterThan(0);
      expect(Number.isInteger(n)).toBe(true);
    });
  });
});

describe('motion helpers', () => {
  it('msOf returns the duration for each beat', () => {
    (Object.keys(MOTION) as Array<keyof typeof MOTION>).forEach((b) => {
      expect(msOf(b)).toBe(MOTION[b]);
    });
  });

  it('cssVarOf returns the matching CSS custom-property reference', () => {
    expect(cssVarOf('crossfade')).toBe('var(--sys-time-crossfade)');
    expect(cssVarOf('settle')).toBe('var(--sys-time-settle)');
  });
});

describe('CEREMONY composition sanity', () => {
  it('tSettle equals MOTION.settle (they are the same beat, named twice)', () => {
    expect(CEREMONY.tSettle).toBe(MOTION.settle);
  });

  it('breath equals MOTION.enter (both are the "room inhales" dwell)', () => {
    expect(CEREMONY.breath).toBe(MOTION.enter);
  });

  it('every ceremony value is positive', () => {
    Object.values(CEREMONY).forEach((n) => expect(n).toBeGreaterThan(0));
  });
});
