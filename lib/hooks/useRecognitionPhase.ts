/**
 * useRecognitionPhase — runtime adapter for the Recognition Timeline.
 *
 * The pure module (`lib/return/recognition-timeline.ts`) names *what*
 * timing applies to a surface; this hook is the single React-side carrier
 * that walks the timeline once per mount and exposes the active phase.
 *
 * One `useEffect`, one `setTimeout` chain (each step schedules the next),
 * one cleanup that nukes the pending timer. SSR-safe — initial phase is
 * `'rest'`; hydration steps the cascade. Replaces the three hand-rolled
 * `setTimeout` cascades that previously lived inside `ReturnLetter.tsx`,
 * `RecognitionWhisper.tsx`, and `ViaWhisper.tsx`.
 *
 * Caller pattern (canonical):
 *
 * ```tsx
 * 'use client';
 * import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
 * import { useRecognitionPhase } from '@/lib/hooks/useRecognitionPhase';
 * import { resolveRecognitionTimeline } from '@/lib/return/recognition-timeline';
 *
 * export function RecognitionWhisper() {
 *   const reducedMotion = useReducedMotion();
 *   const timeline = resolveRecognitionTimeline('whisper', { reducedMotion });
 *   const { phase } = useRecognitionPhase(timeline);
 *   const settled = phase === 'hold' || phase === 'fold';
 *   // …map phase → opacity rung at the call site…
 * }
 * ```
 *
 * Why not five parallel `setTimeout` calls: a chain — each step schedules
 * the next on fire — leaves at most ONE pending timer at any instant.
 * Cleanup is a single `clearTimeout`. Mike napkin §"Module shape" #2:
 * "single useEffect per timeline; one setTimeout chain (not four)".
 *
 * Why the hook does NOT read `useReducedMotion()` itself: the resolver
 * takes the boolean at the boundary (same convention as
 * `recognition-surface.ts` lifting `letterDismissed` up). Pure module
 * stays React-free; hook stays a thin runtime carrier. Mike napkin
 * POI-4: "Reduced-motion is computed once, at the boundary."
 *
 * Credits: Mike Koch (architect, napkin §"Module shape" — single-effect /
 * single-chain / cleanup discipline; the SSR-safe initial-`'rest'`
 * contract; the `useReducedMotion` boundary lift), Tanya Donska (UIX §4.2
 * — phase milestones the chain walks through), Sid (chain-vs-fan
 * implementation rhythm).
 */
'use client';

import { useEffect, useState } from 'react';
import {
  RECOGNITION_PHASES,
  type RecognitionPhase,
  type RecognitionTimeline,
  totalDurationMs,
} from '@/lib/return/recognition-timeline';

/** Public hook surface — single field; future-proof against shape growth. */
export interface UseRecognitionPhaseResult {
  readonly phase: RecognitionPhase;
}

/**
 * Phase machine for a recognition timeline. Returns the active phase
 * for the current mount lifecycle. Cleanup cancels any pending step.
 */
export function useRecognitionPhase(timeline: RecognitionTimeline): UseRecognitionPhaseResult {
  const [phase, setPhase] = useState<RecognitionPhase>('rest');

  useEffect(
    () => walkTimeline(timeline, setPhase),
    // Stable on the four numeric fields — a memoised plan from the
    // resolver shares structural identity, so this rarely re-fires.
    [timeline.liftMs, timeline.settleMs, timeline.holdMs, timeline.foldMs],
  );

  return { phase };
}

// ─── Chain walker — one mutable id, single cleanup ────────────────────────
//
// The chain advances by self-scheduling: each step's setTimeout callback
// sets the next phase and schedules the step after it. Only ONE timer is
// pending at any instant; cleanup is one `clearTimeout` against the
// shared id slot. ≤ 10 LoC per helper, per Sid's discipline.

type Setter = (phase: RecognitionPhase) => void;

/**
 * Schedule the timeline. Returns a cleanup that cancels the pending step.
 * Silent (zero-total-duration) timelines short-circuit to `'fold'` so
 * consumers do not stare at a permanent `'rest'` that never advances.
 */
function walkTimeline(timeline: RecognitionTimeline, setPhase: Setter): () => void {
  if (totalDurationMs(timeline) === 0) { setPhase('fold'); return noopCleanup; }
  const steps = stepsOf(timeline);
  const slot: TimerSlot = { id: undefined };
  advance(slot, steps, 0, setPhase);
  return () => { if (slot.id !== undefined) clearTimeout(slot.id); };
}

interface TimerSlot { id: ReturnType<typeof setTimeout> | undefined }

const noopCleanup = (): void => { /* no chain scheduled */ };

/** (delay, nextPhase) tuples derived from the timeline. Pure, ≤ 10 LoC. */
function stepsOf(t: RecognitionTimeline): readonly (readonly [number, RecognitionPhase])[] {
  // RECOGNITION_PHASES = ['rest','lift','settle','hold','fold']; skip 'rest'.
  const targets = RECOGNITION_PHASES.slice(1);
  const delays = [t.liftMs, t.settleMs, t.holdMs, t.foldMs];
  return targets.map((p, i) => [delays[i], p] as const);
}

/** Self-scheduling chain step. ≤ 10 LoC. */
function advance(
  slot: TimerSlot,
  steps: readonly (readonly [number, RecognitionPhase])[],
  i: number,
  setPhase: Setter,
): void {
  if (i >= steps.length) { slot.id = undefined; return; }
  const [delay, next] = steps[i];
  slot.id = setTimeout(() => { setPhase(next); advance(slot, steps, i + 1, setPhase); }, delay);
}

// ─── Test seam — internal helpers exposed for the unit test ───────────────

/**
 * Test seam — the chain helpers, exposed so the unit test can verify
 * step ordering and cleanup discipline without spinning up a renderer.
 */
export const __testing__ = { walkTimeline, stepsOf, advance } as const;
