/**
 * One-Channel Temporal Fence — sibling of `recognition-surface.test.ts`'s
 * MUTUAL-EXCLUSION property, lifted from spatial to temporal.
 *
 * `pickRecognitionSurface` already enforces the SPATIAL invariant: at any
 * given moment, only ONE recognition surface (`letter|whisper|silent`)
 * is permitted to paint. The selector layer + the route-level mount
 * structure carry it.
 *
 * This fence is the TEMPORAL sibling. It pins three structural promises
 * the named timelines must keep so that — even under hypothetical
 * concurrent mounts — the cue's *paint window* stays single-channel:
 *
 *   §1 · The lift moment of any two non-silent named timelines is
 *        unique. Two cues never *arrive* at the same offset from mount.
 *
 *   §2 · For each named timeline, the active "paint window"
 *        (`lift` + `settle` phases combined) is contiguous. Once past
 *        the window, the timeline never returns to it. *No reentrant
 *        lift.*
 *
 *   §3 · The named timelines together cover the full phase progression:
 *        each non-silent plan visits at least three of the five named
 *        phases over its lifetime. The chain is exercised, not collapsed.
 *
 * NOTE: a stronger property — *pairwise lift+settle windows are
 * disjoint* — does NOT hold across letter and whisper today and is NOT
 * a goal: the mutual-exclusion is enforced spatially (selector + route)
 * and the timelines' "speaking" phases legitimately overlap if both
 * were forced to mount. This fence pins the structural promises that
 * keep the temporal vocabulary single-channel under the contract that
 * IS load-bearing — uniqueness of lift moments, monotonicity of phase
 * progression, exhaustion of the chain.
 *
 * Pure module under test. Same `node` test environment as the surface
 * fence (`recognition-surface.test.ts`) — no jsdom needed.
 *
 * Credits: Mike K. (architect napkin §"Module shape" #4 —
 * `one-channel-temporal-fence` naming and the three structural promises
 * shape; the temporal-sibling-of-spatial-mutex thesis), Tanya D. (UIX
 * §4.2 felt sentence "first beat, then the Hero takes over" — temporal
 * single-channel as the design claim), Sid (≤ 10 LoC per helper).
 */

import {
  letterTimeline, whisperTimeline, silentTimeline,
  phaseAt, totalDurationMs,
  RECOGNITION_PHASES,
  type RecognitionTimeline,
  type RecognitionPhase,
} from '@/lib/return/recognition-timeline';

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

const NAMED: ReadonlyArray<readonly [string, RecognitionTimeline]> = [
  ['letter',  letterTimeline()],
  ['whisper', whisperTimeline()],
  ['silent',  silentTimeline()],
] as const;

const PAINTING: ReadonlyArray<readonly [string, RecognitionTimeline]> = [
  ['letter',  letterTimeline()],
  ['whisper', whisperTimeline()],
] as const;

/** Sample times across the lifecycle — SSR mount + key milestones. */
function lifecycleSamples(t: RecognitionTimeline): readonly number[] {
  const total = Math.max(totalDurationMs(t), 1);
  return [0, t.liftMs, t.liftMs + t.settleMs, total / 2, total, total + 1000];
}

// ─── §1 · Lift moments are unique across named timelines ──────────────────

describe('one-channel temporal fence · §1 lift moments are unique', () => {
  it('letter and whisper do not lift at the same offset from mount', () => {
    expect(letterTimeline().liftMs).not.toBe(whisperTimeline().liftMs);
  });

  it('letter lifts AFTER whisper (the room exhales before it speaks)', () => {
    // Tanya UX §4.2: the SSR paint settles, THEN the letter card
    // approaches. Whisper has no rest delay (its CSS animation-delay
    // owns the visible lift gate); the letter waits one frame seed.
    expect(letterTimeline().liftMs).toBeGreaterThan(whisperTimeline().liftMs);
  });
});

// ─── §2 · Phase progression is monotonic — no reentrant lift ──────────────

describe('one-channel temporal fence · §2 phase progression is monotonic', () => {
  it.each(PAINTING)('plan(%s) — phase index never decreases over time', (_, plan) => {
    const samples = lifecycleSamples(plan);
    let lastIdx = -1;
    for (const t of samples) {
      const p = phaseAt(plan, t);
      const idx = RECOGNITION_PHASES.indexOf(p);
      expect(idx).toBeGreaterThanOrEqual(lastIdx);
      lastIdx = idx;
    }
  });

  it('letter never returns to rest after lifting (no reentrant approach)', () => {
    const t = letterTimeline();
    const afterLift = phaseAt(t, t.liftMs + 1);
    expect(afterLift).not.toBe('rest');
    // Even at very large t, fold is the terminal phase — never rest.
    expect(phaseAt(t, Number.MAX_SAFE_INTEGER)).toBe('fold');
  });
});

// ─── §3 · The chain is exercised — every painting plan visits ≥3 phases ──

describe('one-channel temporal fence · §3 the chain is exercised', () => {
  it.each(PAINTING)('plan(%s) visits ≥3 distinct phases over its lifetime', (_, plan) => {
    const seen = new Set<RecognitionPhase>();
    for (const t of lifecycleSamples(plan)) seen.add(phaseAt(plan, t));
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });

  it('silent plan is the trivial timeline — fold from t=0 onward', () => {
    expect(phaseAt(silentTimeline(), 0)).toBe('fold');
    expect(phaseAt(silentTimeline(), 16000)).toBe('fold');
  });

  it('every painting plan reaches `fold` eventually (no infinite dwell)', () => {
    PAINTING.forEach(([_, plan]) => {
      const total = totalDurationMs(plan);
      expect(phaseAt(plan, total + 1)).toBe('fold');
    });
  });
});

// ─── §4 · Cross-plan sanity — named plans differ in shape ─────────────────

describe('one-channel temporal fence · §4 named plans are distinguishable', () => {
  it('letter and whisper paint windows are not byte-identical', () => {
    expect(letterTimeline()).not.toEqual(whisperTimeline());
  });

  it('three named plans, three named timelines (rule of three cap)', () => {
    expect(NAMED.length).toBe(3);
  });
});
