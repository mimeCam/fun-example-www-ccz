/**
 * Recognition Paint — phase × class exhaustive truth-table.
 *
 * Mirror of `recognition-timeline.test.ts`'s shape (sibling kernel,
 * sibling test): truth table → exhaustiveness → determinism. Pure
 * module under test — `node` test environment is sufficient (no React,
 * no jsdom).
 *
 * Three-layer pin (Mike napkin #115 §"Tests"):
 *
 *   §1 · TRUTH TABLE — every member of `RECOGNITION_PHASES` resolves to
 *        the spec'd Tailwind class. The mapping (Tanya UIX #79 §2.1):
 *
 *          rest            → opacity-0
 *          lift  / settle  → opacity-quiet
 *          hold  / fold    → opacity-muted
 *
 *   §2 · CLASS DOMAIN — every output is one of {opacity-0,
 *        opacity-quiet, opacity-muted}. Three rungs is the rhythm; a
 *        fourth becomes a gradient and the eye loses the one-voice
 *        claim (Tanya UIX #79 §5).
 *
 *   §3 · DETERMINISM — same phase twice → same string. Pure function;
 *        no hidden state.
 *
 * Credits: Mike K. (architect napkin #115 §"Tests" — "exhaustive phase
 * × class table; the `assertNever` path is covered"), Tanya D. (UIX #79
 * §2.1 — the rung verdict this table pins), Sid (≤ 10 LoC per helper).
 */

import {
  RECOGNITION_PHASES,
  type RecognitionPhase,
} from '@/lib/return/recognition-timeline';
import { phaseOpacityClass } from '@/lib/return/recognition-paint';

// ─── Truth table — the spec, line for line ─────────────────────────────────

const EXPECTED: ReadonlyArray<readonly [RecognitionPhase, string]> = [
  ['rest',   'opacity-0'],
  ['lift',   'opacity-quiet'],
  ['settle', 'opacity-quiet'],
  ['hold',   'opacity-muted'],
  ['fold',   'opacity-muted'],
] as const;

/** Tailwind classes admitted by the mapping. ≤ 10 LoC. */
const ADMITTED: ReadonlySet<string> = new Set([
  'opacity-0', 'opacity-quiet', 'opacity-muted',
]);

// ─── §1 · Truth table — every phase resolves to the spec'd class ──────────

describe('recognition-paint · §1 truth table (phase × class)', () => {
  it.each(EXPECTED)('phaseOpacityClass(%s) === %s', (phase, expected) => {
    expect(phaseOpacityClass(phase)).toBe(expected);
  });

  it('rest collapses to the Motion fade-out endpoint (opacity-0)', () => {
    // Tanya UIX #79 §10 acceptance step #1: "Silence for 1500ms. The
    // page is fully painted; the whisper line is not." `rest` is that
    // silence; `opacity-0` is the spelling.
    expect(phaseOpacityClass('rest')).toBe('opacity-0');
  });

  it('lift and settle resolve to the SAME class (the speaking rung)', () => {
    // The wire-shape matters: the cue speaks during both lift and
    // settle; if those rungs disagreed there would be a perceptible
    // step in the middle of the breath.
    expect(phaseOpacityClass('lift')).toBe(phaseOpacityClass('settle'));
  });

  it('hold and fold resolve to the SAME class (the muted footprint)', () => {
    // The dwell-out is one rung. If hold and fold disagreed the cue
    // would step twice on the way down — Tanya UIX #79 §1: "It steps
    // back. The eye skims past."
    expect(phaseOpacityClass('hold')).toBe(phaseOpacityClass('fold'));
  });
});

// ─── §2 · Class domain — every output is an admitted rung ─────────────────

describe('recognition-paint · §2 class domain (three rungs, no gradient)', () => {
  it.each(RECOGNITION_PHASES)('phaseOpacityClass(%s) returns an admitted class', (phase) => {
    expect(ADMITTED.has(phaseOpacityClass(phase))).toBe(true);
  });

  it('the function never returns a fourth rung (Tanya §5: two rungs is the rhythm)', () => {
    const seen = new Set(RECOGNITION_PHASES.map((p) => phaseOpacityClass(p)));
    expect(seen.size).toBeLessThanOrEqual(ADMITTED.size);
  });

  it('every member of RECOGNITION_PHASES is covered (no orphans)', () => {
    const covered = new Set(EXPECTED.map(([p]) => p));
    RECOGNITION_PHASES.forEach((p) => expect(covered.has(p)).toBe(true));
  });
});

// ─── §3 · Determinism — pure function, no hidden state ────────────────────

describe('recognition-paint · §3 determinism (referentially transparent)', () => {
  it.each(RECOGNITION_PHASES)('phaseOpacityClass(%s) is referentially transparent', (phase) => {
    expect(phaseOpacityClass(phase)).toBe(phaseOpacityClass(phase));
  });
});

// ─── §4 · Exhaustiveness witness — assertNever fires on union extension ──

describe('recognition-paint · §4 exhaustiveness witness', () => {
  it('throws a named error for an out-of-union value (compile-time fence)', () => {
    // The `assertNever` arm is unreachable through the public type, but
    // a runtime cast simulates the future-PR scenario "added a phase to
    // the union but forgot to handle it here." The error message names
    // the unhandled value so the failure is self-documenting.
    const cast = phaseOpacityClass as (x: string) => string;
    expect(() => cast('purple')).toThrow(/Unhandled RecognitionPhase: purple/);
  });
});
