/**
 * Transition Choreography — unified thermal transition timing.
 *
 * Instead of each CSS property transitioning independently with
 * scattered durations, TransitionPlan creates an orchestrated cascade:
 *
 *   Phase 1 (0-1s):  background begins shift, gold spotlight appears
 *   Phase 2 (1-3s):  spacing lifts, line-height opens, letters relax
 *   Phase 3 (3-4s):  shadows soften, final color settle
 *
 * The cascade IS the design — the room warming in stages.
 * Floor first, then walls, then air.
 */

/** Duration values in milliseconds for each transition phase. */
export interface TransitionPlan {
  /** Phase 1: background color, gold spotlight onset (ms) */
  colorDuration: number;
  /** Phase 1 delay: 0ms — color is the first perceptual signal */
  colorDelay: number;
  /** Phase 2: spacing, padding, gap settling (ms) */
  spaceDuration: number;
  /** Phase 2 delay: starts after color onset */
  spaceDelay: number;
  /** Phase 3: typography, line-height, font-weight, text-shadow (ms) */
  typoDuration: number;
  /** Phase 3 delay: starts after space begins */
  typoDelay: number;
  /** Phase 3b: shadows, border-radius (ms) */
  shadowDuration: number;
  /** Phase 3b delay */
  shadowDelay: number;
  /** Shared easing for all phases */
  easing: string;
}

/** Default plan — first-time readers warm over 4 seconds. */
export function defaultPlan(): TransitionPlan {
  return {
    colorDuration: 4000,
    colorDelay: 0,
    spaceDuration: 1000,
    spaceDelay: 0,
    typoDuration: 3500,
    typoDelay: 0,
    shadowDuration: 2000,
    shadowDelay: 0,
    easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  };
}

/** Returning-reader plan — the room remembers, settles in 2s. */
export function returningPlan(): TransitionPlan {
  return {
    colorDuration: 2000,
    colorDelay: 0,
    spaceDuration: 800,
    spaceDelay: 0,
    typoDuration: 2000,
    typoDelay: 0,
    shadowDuration: 1500,
    shadowDelay: 0,
    easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  };
}

/** Ceremony plan — room visibly warms after completion (quick but graceful). */
export function ceremonyPlan(): TransitionPlan {
  return {
    colorDuration: 4000,
    colorDelay: 0,
    spaceDuration: 1500,
    spaceDelay: 200,
    typoDuration: 3500,
    typoDelay: 300,
    shadowDuration: 2000,
    shadowDelay: 500,
    easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  };
}
