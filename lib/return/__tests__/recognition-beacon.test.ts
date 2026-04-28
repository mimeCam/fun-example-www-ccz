/**
 * Recognition Beacon — pure-fn × tier × archetype truth-table.
 *
 * Mirrors the shape of `recognition-paint.test.ts` and
 * `recognition-timeline.test.ts`: truth table → exhaustiveness →
 * determinism. Pure module under test — `node` test environment is
 * sufficient (no DOM, no React).
 *
 * Three-layer pin (Mike napkin §4 §"Tests"):
 *
 *   §1 · TIER TRUTH TABLE — every (archetype, visitCount, hasSnapshots)
 *        triple resolves to the spec'd `RecognitionTier`. Mirror of
 *        `useReturnRecognition`'s `resolveTier`. Drift between the two
 *        is the headline failure (Mike §6 POI 6).
 *
 *   §2 · ARCHETYPE BIAS — every member of `ArchetypeKey` resolves to the
 *        bias degrees in §4 of the napkin (5 voices, 5 numbers).
 *
 *   §3 · THREAD ALPHA RUNG — every `RecognitionTier` resolves to the
 *        spec'd alpha-ledger rung (`hairline | muted | recede`).
 *
 *   §4 · DETERMINISM + EXHAUSTIVENESS — same input → same output;
 *        out-of-union value triggers `assertNever`.
 *
 * Credits: Mike K. (architect, `_reports/from-michael-koch-project-architect-100.md`
 * §4 — module shape, exhaustive `Tier × Archetype` table, fence rationale).
 * Tanya D. (UIX, `_reports/from-tanya-donska-expert-uix-designer-56.md` §4.1 —
 * one-rung-step principle that produces this table's rung column).
 */

import {
  deriveTier,
  archetypeAccentBias,
  threadAlphaForTier,
  RECOGNITION_TIERS,
  BEACON_KEYS,
  type RecognitionTier,
} from '@/lib/return/recognition-beacon';
import type { ArchetypeKey } from '@/types/content';

const ARCHETYPES: readonly ArchetypeKey[] = [
  'deep-diver', 'explorer', 'faithful', 'resonator', 'collector',
];

// ─── §1 · Tier truth table — exhaustive over the archetype × counts grid ──

interface TierCase {
  readonly archetype: ArchetypeKey | null;
  readonly visitCount: number;
  readonly hasSnapshots: boolean;
  readonly expected: RecognitionTier;
}

/** Truth table mirroring `useReturnRecognition.resolveTier`. The hook's
 *  semantics: a stranger has neither archetype nor visit count; knowing
 *  *only* an archetype is NOT enough to flip to returning (no snapshots
 *  + < 2 visits stays stranger). This pin guarantees no drift. */
const TIER_CASES: readonly TierCase[] = [
  // stranger — no signals
  { archetype: null, visitCount: 0, hasSnapshots: false, expected: 'stranger' },
  // returning — 2+ visits, no archetype
  { archetype: null, visitCount: 2, hasSnapshots: false, expected: 'returning' },
  { archetype: null, visitCount: 5, hasSnapshots: true,  expected: 'returning' },
  // archetype but no snapshots, < 2 visits — STRANGER per hook semantics
  { archetype: 'explorer', visitCount: 0, hasSnapshots: false, expected: 'stranger' },
  { archetype: 'explorer', visitCount: 1, hasSnapshots: false, expected: 'stranger' },
  // archetype + 2 visits, no snapshots — returning
  { archetype: 'explorer', visitCount: 2, hasSnapshots: false, expected: 'returning' },
  // known — archetype + snapshots
  { archetype: 'deep-diver', visitCount: 0, hasSnapshots: true, expected: 'known' },
  { archetype: 'deep-diver', visitCount: 5, hasSnapshots: true, expected: 'known' },
  // edge: 1 visit, no archetype, no snapshots → stranger
  { archetype: null, visitCount: 1, hasSnapshots: false, expected: 'stranger' },
];

describe('recognition-beacon · §1 tier truth table', () => {
  it.each(TIER_CASES)(
    'deriveTier(%o) === expected',
    ({ archetype, visitCount, hasSnapshots, expected }) => {
      expect(deriveTier(archetype, visitCount, hasSnapshots)).toBe(expected);
    },
  );

  it('every output is a member of RECOGNITION_TIERS', () => {
    for (const c of TIER_CASES) {
      expect(RECOGNITION_TIERS).toContain(deriveTier(c.archetype, c.visitCount, c.hasSnapshots));
    }
  });
});

// ─── §2 · Archetype bias — five voices, five numbers ───────────────────────

describe('recognition-beacon · §2 archetype bias degrees', () => {
  const EXPECTED: ReadonlyArray<readonly [ArchetypeKey, number]> = [
    ['deep-diver', 280],
    ['explorer',    38],
    ['faithful',    12],
    ['resonator',  320],
    ['collector',  200],
  ];

  it.each(EXPECTED)('archetypeAccentBias(%s) === %d', (a, deg) => {
    expect(archetypeAccentBias(a)).toBe(deg);
  });

  it('every bias is in [0, 360)', () => {
    for (const a of ARCHETYPES) {
      const deg = archetypeAccentBias(a);
      expect(deg).toBeGreaterThanOrEqual(0);
      expect(deg).toBeLessThan(360);
    }
  });

  it('biases are distinct (no two archetypes share a hue tilt)', () => {
    const seen = new Set(ARCHETYPES.map(archetypeAccentBias));
    expect(seen.size).toBe(ARCHETYPES.length);
  });

  it('throws on out-of-union archetype (assertNever fence)', () => {
    const cast = archetypeAccentBias as (x: string) => number;
    expect(() => cast('purple')).toThrow(/Unhandled ArchetypeKey: purple/);
  });
});

// ─── §3 · Thread alpha rung — one rung step per tier ───────────────────────

describe('recognition-beacon · §3 thread alpha rung', () => {
  const EXPECTED: ReadonlyArray<readonly [RecognitionTier, string]> = [
    ['stranger',  'hairline'],
    ['returning', 'muted'],
    ['known',     'recede'],
  ];

  it.each(EXPECTED)('threadAlphaForTier(%s) === %s', (tier, rung) => {
    expect(threadAlphaForTier(tier)).toBe(rung);
  });

  it('rungs are strictly ascending (one rung step per tier)', () => {
    // hairline (0.10) < muted (0.30) < recede (0.50) — Tanya §4.1
    const order = ['hairline', 'muted', 'recede', 'quiet'];
    const rungs = RECOGNITION_TIERS.map(threadAlphaForTier);
    const idxs = rungs.map((r) => order.indexOf(r));
    for (let i = 1; i < idxs.length; i++) expect(idxs[i]).toBeGreaterThan(idxs[i - 1]);
  });

  it('throws on out-of-union tier (assertNever fence)', () => {
    const cast = threadAlphaForTier as (x: string) => string;
    expect(() => cast('orange')).toThrow(/Unhandled RecognitionTier: orange/);
  });
});

// ─── §4 · Determinism + key contract ───────────────────────────────────────

describe('recognition-beacon · §4 determinism + BEACON_KEYS contract', () => {
  it.each(ARCHETYPES)('archetypeAccentBias(%s) is referentially transparent', (a) => {
    expect(archetypeAccentBias(a)).toBe(archetypeAccentBias(a));
  });

  it.each(RECOGNITION_TIERS)('threadAlphaForTier(%s) is referentially transparent', (t) => {
    expect(threadAlphaForTier(t)).toBe(threadAlphaForTier(t));
  });

  it('BEACON_KEYS pins the three localStorage addresses', () => {
    // The fence test in `recognition-beacon.fence.test.ts` proves these
    // are the ONLY string-literal addresses for these keys in the
    // `lib/return/` graph; this assertion just pins the values.
    expect(BEACON_KEYS.archetype).toBe('quick-mirror-result');
    expect(BEACON_KEYS.snapshots).toBe('mirror_snapshots');
    expect(BEACON_KEYS.memory).toBe('reading_memory');
  });
});
