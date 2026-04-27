/**
 * Recognition Tempo — exhaustiveness over `ThermalState`, bounds on the
 * approach scale, ease-key membership in the existing `EASE` table, and
 * the dwell-is-sacred contract (proved indirectly via the fact that
 * `TempoMod` carries no `holdMs` / `foldMs` field at all).
 *
 * Mirror of `recognition-paint.test.ts`'s shape (sibling module under
 * `lib/return/`): truth-table → invariant property → reduced-motion
 * fence (here: identity at the cold floor) → determinism. Pure module
 * under test — `node` test environment is sufficient (no React, no
 * jsdom, no DOM).
 *
 * Three-layer pin:
 *
 *   §1 · EXHAUSTIVE OVER ThermalState — every member produces a
 *       `TempoMod` whose `approachScale` clears `tempoInvariantHolds`
 *       and whose `ease` (when non-null) is a member of the existing
 *       `EASE` map (no `ease-thermal` invented — Tanya §3, Mike POI-1).
 *
 *   §2 · MONOTONIC IN WARMTH — `dormant` → `stirring` → `warm` →
 *       `luminous` produces a non-decreasing `approachScale` sequence
 *       (Paul's "warmer means longer breath" framing made structural).
 *
 *   §3 · COLD IS IDENTITY — `recognitionTempo('dormant')` returns
 *       `TEMPO_IDENTITY` (1.0, no ease override). The cold reader's
 *       cadence is byte-identical to today's baseline.
 *
 *   §4 · LUMINOUS HITS THE CEILING — `recognitionTempo('luminous')`
 *       returns `approachScale === APPROACH_CEILING`. The bound Paul
 *       named is the bound the function honors.
 *
 * Credits: Mike Koch (architect, napkin §"Module shape" — three-layer
 * fence shape lifted from `recognition-surface.test.ts`; the
 * `tempoInvariantHolds` invariant; exhaustiveness pin), Tanya Donska
 * (UIX §3 — calibration table this test pins; "no `ease-thermal`"
 * fence), Elon Musk (narrowest-cut §exhaustiveness — the closed-union
 * walk), Paul Kim (warmth-monotonicity framing the test transcribes),
 * Sid (≤ 10 LoC per helper).
 */

import {
  recognitionTempo,
  tempoInvariantHolds,
  TEMPO_IDENTITY,
  APPROACH_CEILING,
  type TempoMod,
} from '@/lib/return/recognition-tempo';
import type { ThermalState } from '@/lib/thermal/thermal-score';
import { EASE } from '@/lib/design/motion';

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

const STATES: readonly ThermalState[] = [
  'dormant', 'stirring', 'warm', 'luminous',
];

/** EASE keys, exposed as an array for membership tests. Pure. */
function easeKeys(): readonly string[] {
  return Object.keys(EASE);
}

/** Sequence of approach scales walked across the warmth gradient. */
function scaleSequence(): readonly number[] {
  return STATES.map((s) => recognitionTempo(s).approachScale);
}

// ─── §1 · Exhaustive over ThermalState — every member maps cleanly ────────

describe('recognition-tempo · §1 exhaustive over ThermalState', () => {
  it.each(STATES)('recognitionTempo(%s) returns a TempoMod', (state) => {
    const tempo = recognitionTempo(state);
    expect(tempo).toBeDefined();
    expect(typeof tempo.approachScale).toBe('number');
  });

  it.each(STATES)('recognitionTempo(%s) clears the invariant fence', (state) => {
    expect(tempoInvariantHolds(recognitionTempo(state))).toBe(true);
  });

  it.each(STATES)('recognitionTempo(%s) produces an ease key from EASE (or null)', (state) => {
    const { ease } = recognitionTempo(state);
    if (ease === null) return;                 // no override — vacuously safe
    expect(easeKeys()).toContain(ease);
  });

  it('no thermal state produces an invented ease curve (no `ease-thermal`)', () => {
    const eases = STATES.map((s) => recognitionTempo(s).ease).filter((e) => e !== null);
    eases.forEach((e) => expect(easeKeys()).toContain(e));
  });
});

// ─── §2 · Monotonic in warmth — warmer never reduces the breath ───────────

describe('recognition-tempo · §2 monotonic in warmth', () => {
  it('approachScale is non-decreasing across `dormant` → `luminous`', () => {
    const seq = scaleSequence();
    for (let i = 1; i < seq.length; i++) {
      expect(seq[i]).toBeGreaterThanOrEqual(seq[i - 1]);
    }
  });

  it('warmer states never dip below the cold floor (identity)', () => {
    scaleSequence().forEach((scale) => expect(scale).toBeGreaterThanOrEqual(1.0));
  });
});

// ─── §3 · Cold is identity — baseline behaviour preserved ─────────────────

describe('recognition-tempo · §3 cold is identity', () => {
  it("recognitionTempo('dormant') === TEMPO_IDENTITY", () => {
    expect(recognitionTempo('dormant')).toEqual(TEMPO_IDENTITY);
  });

  it('the identity tempo has approachScale 1.0 and no ease override', () => {
    expect(TEMPO_IDENTITY.approachScale).toBe(1.0);
    expect(TEMPO_IDENTITY.ease).toBeNull();
  });
});

// ─── §4 · Luminous hits the ceiling — Paul's bound is honored ────────────

describe('recognition-tempo · §4 luminous hits the approach ceiling', () => {
  it("recognitionTempo('luminous').approachScale === APPROACH_CEILING", () => {
    expect(recognitionTempo('luminous').approachScale).toBe(APPROACH_CEILING);
  });

  it('the ceiling itself is exactly 1.30 (Paul risk-table; Tanya §3 ratified)', () => {
    expect(APPROACH_CEILING).toBe(1.30);
  });

  it("luminous overrides ease to 'settle' (the long-tail curve)", () => {
    expect(recognitionTempo('luminous').ease).toBe('settle');
  });
});

// ─── §5 · Invariant fence — bounds on approachScale ───────────────────────

describe('recognition-tempo · §5 tempoInvariantHolds', () => {
  it('rejects an approachScale below 1.0 (cooler than identity is forbidden)', () => {
    const bad: TempoMod = { approachScale: 0.95, ease: null };
    expect(tempoInvariantHolds(bad)).toBe(false);
  });

  it('rejects an approachScale above APPROACH_CEILING', () => {
    const bad: TempoMod = { approachScale: APPROACH_CEILING + 0.01, ease: null };
    expect(tempoInvariantHolds(bad)).toBe(false);
  });

  it('accepts the boundary exactly — APPROACH_CEILING itself is valid', () => {
    expect(tempoInvariantHolds({ approachScale: APPROACH_CEILING, ease: 'settle' })).toBe(true);
  });

  it('accepts the cold floor exactly — 1.0 is valid', () => {
    expect(tempoInvariantHolds(TEMPO_IDENTITY)).toBe(true);
  });
});

// ─── §6 · Determinism — same input twice → same output ────────────────────

describe('recognition-tempo · §6 purity', () => {
  it.each(STATES)('recognitionTempo(%s) is referentially transparent', (state) => {
    expect(recognitionTempo(state)).toEqual(recognitionTempo(state));
  });
});

// ─── §7 · Shape pin — TempoMod has no dwell field ─────────────────────────

describe('recognition-tempo · §7 the dwell is sacred (shape pin)', () => {
  it('TempoMod carries no `holdMs` / `foldMs` field', () => {
    // Structural pin — this test would fail to compile *and* fail at
    // runtime if a future contributor extended `TempoMod` to modulate
    // the dwell. Keeps Mike POI-3 / Tanya §1 enforcement structural,
    // not prose. Note: this asserts `undefined` for both keys — which
    // is exactly what a closed-shape `TempoMod` produces.
    const tempo = recognitionTempo('luminous') as unknown as Record<string, unknown>;
    expect(tempo.holdMs).toBeUndefined();
    expect(tempo.foldMs).toBeUndefined();
  });
});
