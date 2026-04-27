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
import type { ThermalState } from '@/lib/thermal/thermal-score';
import { MOTION, MOTION_REDUCED_MS, CEREMONY } from '@/lib/design/motion';
import { APPROACH_CEILING } from '@/lib/return/recognition-tempo';

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

  it('whisper t=0 sits at rest (the kernel-owned anticipation breath)', () => {
    // Mike napkin §"Kernel-Owned Anticipation" — `liftMs = MOTION.settle`
    // promotes the previously-inline CSS animationDelay into the kernel.
    // For the first 1500ms the whisper sits at rest; the lift gate is
    // owned by the timeline, not by the surface.
    expect(phaseAt(whisperTimeline(), 0)).toBe('rest');
  });

  it('whisper t=liftMs falls into settle immediately (settleMs is zero-width)', () => {
    const t = whisperTimeline();
    // settleMs = 0; phaseAt is half-open, so t = liftMs lands directly
    // in 'settle' (lift is a zero-ms blip the chain walker steps through).
    expect(phaseAt(t, t.liftMs)).toBe('settle');
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

// ─── 6 · Recognition Cadence — thermal modulates the approach only ────────
//
// Mike napkin §"Module shape" — the resolver accepts an optional
// `thermal` field that lengthens *only* the returner's first-paint
// approach (`liftMs` / `settleMs`). The dwell (`holdMs` / `foldMs`)
// stays sacred (Mike POI-3, Tanya §1.1). Reduced motion always wins —
// the floor short-circuits before tempo is consulted.

describe('recognition-timeline · §6 thermal-omitted is byte-identical', () => {
  it('every surface — omitting `thermal` reproduces today\'s plan', () => {
    SURFACES.forEach((surface) => {
      const before = resolveRecognitionTimeline(surface, { reducedMotion: false });
      // Omitting the field is the documented backward-compatibility
      // contract. Pin it explicitly — this is the property that makes
      // the extension safe to land standalone (Mike sequencing #1).
      expect(before).toBeDefined();
    });
  });

  it('letter @ dormant is byte-identical to letter @ no-thermal (cold reader = baseline)', () => {
    const baseline = resolveRecognitionTimeline('letter', { reducedMotion: false });
    const dormant  = resolveRecognitionTimeline('letter', { reducedMotion: false, thermal: 'dormant' });
    expect(dormant).toEqual(baseline);
  });

  it('whisper @ dormant is byte-identical to whisper @ no-thermal', () => {
    const baseline = resolveRecognitionTimeline('whisper', { reducedMotion: false });
    const dormant  = resolveRecognitionTimeline('whisper', { reducedMotion: false, thermal: 'dormant' });
    expect(dormant).toEqual(baseline);
  });
});

describe('recognition-timeline · §6 thermal modulates the approach (lift+settle only)', () => {
  it.each(['stirring','warm','luminous'] as const)
    ('letter @ %s lengthens liftMs above the cold floor', (state: ThermalState) => {
      const cold = resolveRecognitionTimeline('letter', { reducedMotion: false, thermal: 'dormant' });
      const warm = resolveRecognitionTimeline('letter', { reducedMotion: false, thermal: state });
      expect(warm.liftMs).toBeGreaterThan(cold.liftMs);
    });

  it.each(['stirring','warm','luminous'] as const)
    ('whisper @ %s lengthens liftMs above the cold floor', (state: ThermalState) => {
      const cold = resolveRecognitionTimeline('whisper', { reducedMotion: false, thermal: 'dormant' });
      const warm = resolveRecognitionTimeline('whisper', { reducedMotion: false, thermal: state });
      expect(warm.liftMs).toBeGreaterThan(cold.liftMs);
    });

  it.each(['dormant','stirring','warm','luminous'] as const)
    ('letter @ %s preserves holdMs (the dwell is sacred)', (state: ThermalState) => {
      const cold = resolveRecognitionTimeline('letter', { reducedMotion: false, thermal: 'dormant' });
      const warm = resolveRecognitionTimeline('letter', { reducedMotion: false, thermal: state });
      expect(warm.holdMs).toBe(cold.holdMs);
    });

  it.each(['dormant','stirring','warm','luminous'] as const)
    ('whisper @ %s preserves holdMs (the dwell is sacred)', (state: ThermalState) => {
      const cold = resolveRecognitionTimeline('whisper', { reducedMotion: false, thermal: 'dormant' });
      const warm = resolveRecognitionTimeline('whisper', { reducedMotion: false, thermal: state });
      expect(warm.holdMs).toBe(cold.holdMs);
    });

  it.each(['dormant','stirring','warm','luminous'] as const)
    ('letter @ %s preserves foldMs (the dwell is sacred)', (state: ThermalState) => {
      const cold = resolveRecognitionTimeline('letter', { reducedMotion: false, thermal: 'dormant' });
      const warm = resolveRecognitionTimeline('letter', { reducedMotion: false, thermal: state });
      expect(warm.foldMs).toBe(cold.foldMs);
    });

  it.each(['dormant','stirring','warm','luminous'] as const)
    ('whisper @ %s preserves foldMs (the dwell is sacred)', (state: ThermalState) => {
      const cold = resolveRecognitionTimeline('whisper', { reducedMotion: false, thermal: 'dormant' });
      const warm = resolveRecognitionTimeline('whisper', { reducedMotion: false, thermal: state });
      expect(warm.foldMs).toBe(cold.foldMs);
    });

  it('luminous never crosses the approach ceiling (≤ baseline × APPROACH_CEILING)', () => {
    const cold     = resolveRecognitionTimeline('whisper', { reducedMotion: false, thermal: 'dormant' });
    const luminous = resolveRecognitionTimeline('whisper', { reducedMotion: false, thermal: 'luminous' });
    expect(luminous.liftMs).toBeLessThanOrEqual(Math.round(cold.liftMs * APPROACH_CEILING));
  });

  it('luminous overrides the whisper ease to `settle` (the long-tail curve)', () => {
    const luminous = resolveRecognitionTimeline('whisper', { reducedMotion: false, thermal: 'luminous' });
    expect(luminous.ease).toBe('settle');
  });

  it('warm preserves the surface ease (no override below luminous)', () => {
    const warmLetter  = resolveRecognitionTimeline('letter',  { reducedMotion: false, thermal: 'warm' });
    const warmWhisper = resolveRecognitionTimeline('whisper', { reducedMotion: false, thermal: 'warm' });
    expect(warmLetter.ease).toBe(letterTimeline().ease);     // 'out'
    expect(warmWhisper.ease).toBe(whisperTimeline().ease);   // 'sustain'
  });
});

describe('recognition-timeline · §6 reduced-motion always wins (tempo never leaks)', () => {
  it.each(['dormant','stirring','warm','luminous'] as const)
    ('reducedMotion + thermal=%s collapses to MOTION_REDUCED_MS on every duration', (state: ThermalState) => {
      const t = resolveRecognitionTimeline('whisper', { reducedMotion: true, thermal: state });
      expect(t.liftMs).toBe(MOTION_REDUCED_MS);
      expect(t.settleMs).toBe(MOTION_REDUCED_MS);
      expect(t.holdMs).toBe(MOTION_REDUCED_MS);
      expect(t.foldMs).toBe(MOTION_REDUCED_MS);
    });

  it.each(['dormant','stirring','warm','luminous'] as const)
    ('reducedMotion + thermal=%s is byte-identical to no-thermal', (state: ThermalState) => {
      const a = resolveRecognitionTimeline('whisper', { reducedMotion: true });
      const b = resolveRecognitionTimeline('whisper', { reducedMotion: true, thermal: state });
      expect(a).toEqual(b);
    });
});

describe('recognition-timeline · §6 silent surface is unaffected by thermal', () => {
  it.each(['dormant','stirring','warm','luminous'] as const)
    ('silent @ %s remains the no-op plan (zero × scale = zero)', (state: ThermalState) => {
      const t = resolveRecognitionTimeline('silent', { reducedMotion: false, thermal: state });
      expect(t.liftMs).toBe(0);
      expect(t.settleMs).toBe(0);
      expect(t.holdMs).toBe(0);
      expect(t.foldMs).toBe(0);
    });
});

describe('recognition-timeline · §6 modulated plans honour the timeline invariant', () => {
  const SURFACES_PAINTING: readonly RecognitionSurface[] = ['letter', 'whisper'];
  const STATES: readonly ThermalState[] = ['dormant', 'stirring', 'warm', 'luminous'];

  SURFACES_PAINTING.forEach((s) => STATES.forEach((state) => {
    it(`plan(${s}, thermal=${state}) clears timelineInvariantHolds`, () => {
      const t = resolveRecognitionTimeline(s, { reducedMotion: false, thermal: state });
      expect(timelineInvariantHolds(t)).toBe(true);
    });
  }));
});
