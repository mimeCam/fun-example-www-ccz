/**
 * Recognition Timeline — invariants + resolver exhaustiveness + reduced-
 * motion collapse.
 *
 * Mirror of `recognition-surface.test.ts`'s shape (same module, sibling
 * file): truth-table → invariant property → reduced-motion collapse →
 * determinism. Pure module under test — `node` test environment is
 * sufficient (no React, no jsdom).
 *
 * Three-layer pin (Mike napkin §"Module shape" #4):
 *
 *   1 · INVARIANTS HOLD — every named plan satisfies
 *       `timelineInvariantHolds()` (durations ≥ 0, holdMs ≤ MOTION.settle
 *       * 8, settleMs+holdMs ≥ CEREMONY.breath when painting).
 *
 *   2 · RESOLVER EXHAUSTIVE — every `RecognitionSurface` member maps to
 *       a non-null timeline; missing arms are a TypeScript error before
 *       this test runs (the resolver uses `assertNever`).
 *
 *   3 · REDUCED-MOTION COLLAPSE — under `prefers-reduced-motion: reduce`
 *       every duration === MOTION_REDUCED_MS (single floor). The fence
 *       across the system collapses to one switch (Mike POI-4).
 *
 * Credits: Mike K. (architect napkin §"Module shape" #4 — three-layer
 * fence shape lifted from `recognition-surface.test.ts`), Tanya D. (UIX
 * §4.2 reduced-motion paragraph — felt-sentence grounding for the
 * collapse), Sid (≤ 10 LoC per helper).
 */

import {
  letterTimeline, whisperTimeline, silentTimeline,
  resolveRecognitionTimeline, timelineInvariantHolds,
  phaseAt, totalDurationMs,
  RECOGNITION_PHASES,
  type RecognitionTimeline, type RecognitionPhase,
} from '@/lib/return/recognition-timeline';
import type { RecognitionSurface } from '@/lib/return/recognition-surface';
import { MOTION, MOTION_REDUCED_MS, CEREMONY } from '@/lib/design/motion';

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

const SURFACES: readonly RecognitionSurface[] = ['letter', 'whisper', 'silent'];

function namedPlans(): readonly RecognitionTimeline[] {
  return [letterTimeline(), whisperTimeline(), silentTimeline()];
}

function reducedDurations(t: RecognitionTimeline): readonly number[] {
  return [t.liftMs, t.settleMs, t.holdMs, t.foldMs];
}

// ─── 1 · Invariants — every named plan clears the fence ───────────────────

describe('recognition-timeline · §1 invariants hold for every named plan', () => {
  it.each(SURFACES)('plan(%s) satisfies timelineInvariantHolds', (surface) => {
    const plan = resolveRecognitionTimeline(surface, { reducedMotion: false });
    expect(timelineInvariantHolds(plan)).toBe(true);
  });

  it('letter plan has all non-negative durations', () => {
    const t = letterTimeline();
    expect(t.liftMs).toBeGreaterThanOrEqual(0);
    expect(t.settleMs).toBeGreaterThanOrEqual(0);
    expect(t.holdMs).toBeGreaterThanOrEqual(0);
    expect(t.foldMs).toBeGreaterThanOrEqual(0);
  });

  it('every named plan caps holdMs at MOTION.settle * 8 (no infinite dwell)', () => {
    namedPlans().forEach((p) => expect(p.holdMs).toBeLessThanOrEqual(MOTION.settle * 8));
  });

  it('painting plans clear the silence-perceptibility floor (settle+hold ≥ breath)', () => {
    [letterTimeline(), whisperTimeline()].forEach((p) =>
      expect(p.settleMs + p.holdMs).toBeGreaterThanOrEqual(CEREMONY.breath));
  });

  it('silent plan is the no-op (every duration === 0)', () => {
    const t = silentTimeline();
    expect(reducedDurations(t)).toEqual([0, 0, 0, 0]);
  });

  it('rejects a timeline with a negative duration', () => {
    const bad: RecognitionTimeline = { ...whisperTimeline(), foldMs: -1 };
    expect(timelineInvariantHolds(bad)).toBe(false);
  });

  it('rejects a timeline with infinite-feeling holdMs (over MOTION.settle * 8)', () => {
    const bad: RecognitionTimeline = { ...whisperTimeline(), holdMs: MOTION.settle * 8 + 1 };
    expect(timelineInvariantHolds(bad)).toBe(false);
  });
});

// ─── 2 · Resolver exhaustive over RecognitionSurface ───────────────────────

describe('recognition-timeline · §2 resolver maps every surface (exhaustive)', () => {
  it.each(SURFACES)('resolveRecognitionTimeline(%s, …) returns a plan', (surface) => {
    const plan = resolveRecognitionTimeline(surface, { reducedMotion: false });
    expect(plan).toBeDefined();
    expect(typeof plan.liftMs).toBe('number');
  });

  it('letter and whisper have distinct shapes (no accidental aliasing)', () => {
    const a = letterTimeline();
    const b = whisperTimeline();
    expect(a).not.toEqual(b);
  });

  it('letter plan has a non-zero approach delay (the room exhales first)', () => {
    expect(letterTimeline().liftMs).toBeGreaterThan(0);
  });

  it('whisper plan dwells for eight linger breaths (the canonical recognition silence)', () => {
    expect(whisperTimeline().holdMs).toBe(MOTION.linger * 8);
  });
});

// ─── 3 · Reduced-motion collapse ──────────────────────────────────────────

describe('recognition-timeline · §3 reduced-motion collapses every duration', () => {
  it.each(SURFACES)('every duration in plan(%s) === MOTION_REDUCED_MS', (surface) => {
    const plan = resolveRecognitionTimeline(surface, { reducedMotion: true });
    expect(reducedDurations(plan).every((ms) => ms === MOTION_REDUCED_MS)).toBe(true);
  });

  it('reduced plan retains the surface-specific easing (taste survives the floor)', () => {
    const r = resolveRecognitionTimeline('letter', { reducedMotion: true });
    const f = letterTimeline();
    expect(r.ease).toBe(f.ease);
  });

  it('reduced plan total duration === 4 × MOTION_REDUCED_MS (one frame per phase)', () => {
    SURFACES.forEach((s) => {
      const plan = resolveRecognitionTimeline(s, { reducedMotion: true });
      expect(totalDurationMs(plan)).toBe(4 * MOTION_REDUCED_MS);
    });
  });
});

// ─── 4 · phaseAt — half-open interval semantics ───────────────────────────

describe('recognition-timeline · §4 phaseAt walks the milestones', () => {
  it('letter t=0 → rest (the room is unaware)', () => {
    expect(phaseAt(letterTimeline(), 0)).toBe('rest');
  });

  it('letter t=liftMs → lift (the cue arrives)', () => {
    const t = letterTimeline();
    expect(phaseAt(t, t.liftMs)).toBe('lift');
  });

  it('letter t=liftMs+settleMs → settle (the cue dwells)', () => {
    const t = letterTimeline();
    expect(phaseAt(t, t.liftMs + t.settleMs)).toBe('settle');
  });

  it('letter t=∞ → fold (eventually the cue retires)', () => {
    expect(phaseAt(letterTimeline(), Number.MAX_SAFE_INTEGER)).toBe('fold');
  });

  it('whisper t=0 falls into settle immediately (lift+rest are zero-width)', () => {
    expect(phaseAt(whisperTimeline(), 0)).toBe('settle');
  });

  it('phaseAt is monotonic — once past a phase, never returns to it', () => {
    const samples = [0, 100, 500, 1200, 8000, 9500, 16000];
    const seen = new Set<RecognitionPhase>();
    let lastIdx = -1;
    for (const t of samples) {
      const p = phaseAt(letterTimeline(), t);
      const idx = RECOGNITION_PHASES.indexOf(p);
      expect(idx).toBeGreaterThanOrEqual(lastIdx);
      lastIdx = idx;
      seen.add(p);
    }
    // sanity — we visited at least three distinct phases
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });
});

// ─── 5 · Determinism — same input twice → same output ─────────────────────

describe('recognition-timeline · §5 purity', () => {
  it('resolveRecognitionTimeline is referentially transparent', () => {
    const a = resolveRecognitionTimeline('letter', { reducedMotion: false });
    const b = resolveRecognitionTimeline('letter', { reducedMotion: false });
    expect(a).toEqual(b);
  });

  it('phaseAt is referentially transparent', () => {
    const t = whisperTimeline();
    expect(phaseAt(t, 4200)).toBe(phaseAt(t, 4200));
  });
});
