/**
 * hue-distance — unit tests for the shared sibling-voice audit kernel.
 *
 * The kernel (`lib/design/hue-distance.ts`) is now load-bearing: two
 * audits import it (`archetype-hue-distance`, `worldview-hue-distance`).
 * Property tests pin the four shapes the audits lean on so a future
 * caller — or a third audit when a third register graduates — inherits
 * a kernel that behaves:
 *
 *   1. `familyPairs` returns every unordered pair (n choose 2). Empty
 *      and singleton lists yield zero pairs (audit-safe).
 *   2. `deltaHue` is symmetric, bounded `[0, 180]`, and pins to the
 *      math kernel's `circularHueDelta` outputs (drift = red).
 *   3. `deltaTable` keys read `"<a>↔<b>"`; values read `"X.XX°"`.
 *      Identity-pair would print "0.00°" — the audit excludes those by
 *      construction (no `[x, x]` pairs from `familyPairs`).
 *   4. `worstPair.dh` is the minimum entry of the `deltaTable`. The
 *      kernel's `worstPair` and `deltaTable` cannot disagree.
 *   5. `surfaceReceipt` shape is `Record<surface, Record<pair, "X.XX°">>`
 *      — the snapshot shape both audits emit.
 *
 * Resolver errors are loud: `hueOf("not-a-family", {})` throws — silent
 * `NaN` propagation through a Δh assertion would mute a real regression.
 *
 * Pure Jest. No DOM, no Canvas. Numbers, not adjectives.
 *
 * Credits: Mike K. (napkin §"Sibling Voice Hue Distance (2)" — the kernel
 * is now load-bearing, property tests are the fence); Tanya D. (UX #60
 * §3 — "shape decides group; numbers, not adjectives" — the receipt
 * shape this kernel emits); Krystle C. (the per-surface audit pattern).
 */

import {
  deltaHue,
  deltaTable,
  familyPairs,
  hueOf,
  surfaceReceipt,
  worstPair,
} from '../hue-distance';

// ─── Fixture — small synthetic palette, no project anchors ───────────────
//
// Synthetic on purpose: the kernel is surface-agnostic; using BRAND here
// would tangle the kernel test with the live palette and turn a kernel
// regression into a palette regression (Mike #54 — separate the layers).

const RED   = '#ff0000'; // h = 0°
const GREEN = '#00ff00'; // h = 120°
const BLUE  = '#0000ff'; // h = 240°
const PALETTE: Record<string, string> = { red: RED, green: GREEN, blue: BLUE };

// ─── 1 · familyPairs — n choose 2, no self-pairs ─────────────────────────

describe('hue-distance · familyPairs — every unordered pair', () => {
  it('three families → three pairs (3 choose 2)', () => {
    expect(familyPairs(['red', 'green', 'blue'])).toEqual([
      ['red', 'green'],
      ['red', 'blue'],
      ['green', 'blue'],
    ]);
  });

  it('singleton → zero pairs (audit needs ≥ 1 pair)', () => {
    expect(familyPairs(['red'])).toEqual([]);
  });

  it('empty list → zero pairs', () => {
    expect(familyPairs([])).toEqual([]);
  });

  it('no self-pair appears in the output', () => {
    for (const [a, b] of familyPairs(['red', 'green', 'blue'])) {
      expect(a).not.toBe(b);
    }
  });

  it('count matches n·(n−1)/2 for a sweep', () => {
    // `Object.is(-0, 0)` is false; n=0 yields `(0 * -1) / 2 === -0`. Add 0
    // to normalize the sign so the comparison reads the integer, not the
    // signed-zero IEEE-754 corner. (Pure arithmetic, no kernel impact.)
    for (const n of [0, 1, 2, 3, 5, 8]) {
      const fams = Array.from({ length: n }, (_, i) => `f${i}`);
      expect(familyPairs(fams).length).toBe(((n * (n - 1)) / 2) + 0);
    }
  });
});

// ─── 2 · hueOf / deltaHue — math-kernel projection ───────────────────────

describe('hue-distance · hueOf / deltaHue — math-kernel projection', () => {
  it('hueOf("red") === 0°', () => {
    expect(hueOf('red', PALETTE)).toBe(0);
  });

  it('hueOf("green") === 120°', () => {
    expect(hueOf('green', PALETTE)).toBe(120);
  });

  it('hueOf throws on unknown family (loud, not silent NaN)', () => {
    expect(() => hueOf('mauve', PALETTE)).toThrow(/unknown family/);
  });

  it('deltaHue is symmetric: Δh(a, b) === Δh(b, a)', () => {
    expect(deltaHue('red', 'green', PALETTE))
      .toBe(deltaHue('green', 'red', PALETTE));
  });

  it('deltaHue(red, green) === 120°', () => {
    expect(deltaHue('red', 'green', PALETTE)).toBe(120);
  });

  it('deltaHue ∈ [0, 180] for every pair in the palette', () => {
    for (const [a, b] of familyPairs(['red', 'green', 'blue'])) {
      const dh = deltaHue(a, b, PALETTE);
      expect(dh).toBeGreaterThanOrEqual(0);
      expect(dh).toBeLessThanOrEqual(180);
    }
  });
});

// ─── 3 · deltaTable — keys "<a>↔<b>", values "X.XX°" ─────────────────────

describe('hue-distance · deltaTable — receipt row shape', () => {
  it('keys read "<a>↔<b>" for every unordered pair', () => {
    const t = deltaTable(['red', 'green', 'blue'], PALETTE);
    expect(Object.keys(t).sort()).toEqual(
      ['green↔blue', 'red↔blue', 'red↔green'].sort(),
    );
  });

  it('values read with two-decimal degrees suffix', () => {
    const t = deltaTable(['red', 'green'], PALETTE);
    for (const v of Object.values(t)) {
      expect(v).toMatch(/^\d+\.\d{2}°$/);
    }
  });

  it('singleton input → empty table (no rows)', () => {
    expect(deltaTable(['red'], PALETTE)).toEqual({});
  });
});

// ─── 4 · worstPair — minimum, never disagrees with deltaTable ────────────

describe('hue-distance · worstPair — minimum Δh on a surface', () => {
  it('worstPair.dh equals the min of deltaTable values', () => {
    const fams = ['red', 'green', 'blue'];
    const { dh } = worstPair(fams, PALETTE);
    const min = Math.min(
      ...Object.values(deltaTable(fams, PALETTE)).map((v) => parseFloat(v)),
    );
    expect(dh).toBeCloseTo(min, 2);
  });

  it('worstPair.pair is one of deltaTable\'s keys', () => {
    const fams = ['red', 'green', 'blue'];
    const { pair } = worstPair(fams, PALETTE);
    expect(Object.keys(deltaTable(fams, PALETTE))).toContain(pair);
  });
});

// ─── 5 · surfaceReceipt — `Record<surface, Record<pair, "X.XX°">>` ──────

describe('hue-distance · surfaceReceipt — snapshot shape', () => {
  it('one row per surface, keys are the surface names', () => {
    const r = surfaceReceipt({ chip: ['red', 'green'] }, PALETTE);
    expect(Object.keys(r)).toEqual(['chip']);
  });

  it('row value matches deltaTable for that surface', () => {
    const fams = ['red', 'green', 'blue'];
    const r = surfaceReceipt({ chip: fams }, PALETTE);
    expect(r.chip).toEqual(deltaTable(fams, PALETTE));
  });

  it('multiple surfaces stay independent', () => {
    const r = surfaceReceipt(
      { chipA: ['red', 'green'], chipB: ['green', 'blue'] },
      PALETTE,
    );
    expect(Object.keys(r).sort()).toEqual(['chipA', 'chipB']);
    expect(r.chipA['red↔green']).toBe('120.00°');
    expect(r.chipB['green↔blue']).toBe('120.00°');
  });
});
