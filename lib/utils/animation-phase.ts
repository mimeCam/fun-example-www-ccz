/**
 * animation-phase — pure helpers for the Threshold exit choreography.
 *
 * "The chamber leaves. Then the room dims. Same 150ms, whole different
 * feeling." (Tanya D., UX spec). This module owns the *numeric* invariants
 * and the phase → className resolution so the hook and the component stay
 * declarative. No React, no DOM, no state — just maps and guarantees.
 *
 * Shared for future modal-like primitives (toast, popover) per AGENTS.md.
 *
 * Credits: Mike K. (phase machine scope), Tanya D. (stagger cadence),
 * Krystle C. (deferred-unmount foundation), Elon M. (no-new-tokens line).
 */

// ─── Phase vocabulary ──────────────────────────────────────────────────────

/** Four-state lifecycle. `closed` ⇒ portal unmounts. */
export type Phase = 'closed' | 'opening' | 'open' | 'closing';

/** Supported surface shapes. Matches `<Threshold variant>`. */
export type ThresholdVariant = 'center' | 'drawer-right';

// ─── Timing constants — numeric invariants, not knobs ──────────────────────

/** Backdrop waits this long before starting its fade on close. */
export const BACKDROP_EXIT_DELAY_MS = 60;

/** Backdrop fade duration after the delay. Ends with the chamber. */
export const BACKDROP_EXIT_MS = 90;

/** Chamber exit duration — matches `animate-slide-out-right` keyframe. */
export const CHAMBER_EXIT_MS = 150;

/** Safety margin before declaring the close "settled" (for cleanup). */
export const EXIT_SETTLE_BUDGET_MS = CHAMBER_EXIT_MS + 16;

// ─── Invariants — encoded so tests can lock them down ──────────────────────

/** Must hold: backdrop starts later, both finish together. Pure. */
export function staggerInvariantHolds(): boolean {
  if (BACKDROP_EXIT_DELAY_MS <= 0) return false;
  if (BACKDROP_EXIT_DELAY_MS >= CHAMBER_EXIT_MS) return false;
  return BACKDROP_EXIT_DELAY_MS + BACKDROP_EXIT_MS === CHAMBER_EXIT_MS;
}

// ─── Class resolvers — phase × variant × reduced-motion → className ────────

/** Chamber entrance class. Existing Tailwind utilities only. */
export function resolveEntranceClass(
  variant: ThresholdVariant,
  reduced: boolean,
): string {
  if (reduced) return 'motion-safe:animate-fade-in';
  if (variant === 'drawer-right') return 'animate-slide-in-right';
  return 'animate-fade-in';
}

/** Chamber exit class. Existing Tailwind utilities only. */
export function resolveExitClass(
  variant: ThresholdVariant,
  reduced: boolean,
): string {
  if (reduced) return '';
  if (variant === 'drawer-right') return 'animate-slide-out-right';
  return 'animate-fade-out';
}

/** Pick entrance or exit by phase. `open`/`closed` contribute no animation. */
export function resolveChamberAnimationClass(
  phase: Phase,
  variant: ThresholdVariant,
  reduced: boolean,
): string {
  if (phase === 'opening') return resolveEntranceClass(variant, reduced);
  if (phase === 'closing') return resolveExitClass(variant, reduced);
  return '';
}

// ─── Backdrop choreography ─────────────────────────────────────────────────

/** Backdrop class by phase. Stagger is a transition-delay, not a keyframe. */
export function resolveBackdropAnimationClass(
  phase: Phase,
  reduced: boolean,
): string {
  if (reduced) return 'motion-reduce:opacity-100';
  if (phase === 'opening') return 'animate-fade-in';
  if (phase === 'closing') return 'animate-fade-out opacity-0';
  return '';
}

/** Inline style for the backdrop — owns the exit stagger + exit duration. */
export function resolveBackdropStyle(
  phase: Phase,
  reduced: boolean,
): React.CSSProperties | undefined {
  if (reduced || phase !== 'closing') return undefined;
  return {
    animationDelay: `${BACKDROP_EXIT_DELAY_MS}ms`,
    animationDuration: `${BACKDROP_EXIT_MS}ms`,
    animationFillMode: 'forwards',
  };
}

// ─── Chamber exit polish — Tanya §3.1 duration + §4.3 border lead ──────────

/**
 * Inline style for the chamber during exit:
 *  - normalise duration to CHAMBER_EXIT_MS (the center `animate-fade-out`
 *    keyframe ships at 300 ms; the drawer's slide-out already sits at 150 ms);
 *  - dissolve the border at t=0 so it leads the fill by one frame.
 */
export function resolveChamberExitStyle(
  phase: Phase,
  reduced: boolean,
): React.CSSProperties | undefined {
  if (reduced || phase !== 'closing') return undefined;
  return {
    animationDuration: `${CHAMBER_EXIT_MS}ms`,
    borderColor: 'transparent',
    transition: 'border-color 30ms linear',
  };
}
