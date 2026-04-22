/**
 * useFieldPhase — minimal state machine for the `<Field>` listening surface.
 *
 * Owns the `rest → focus → rest` transitions and the transient `error-held`
 * phase that arrives when the caller flips `invalid` true. Error-held
 * auto-resolves after FIELD_ERROR_HOLD_MS and returns to the caller's
 * current focus truth (Tanya §4 — one held frame, no shake).
 *
 * Reduced-motion comes from the shared `reduced-motion.ts` probe so
 * `<Pressable>` and `<Field>` read one subscription.
 *
 * Credits: Mike K. (phase-machine pattern §3.1), Tanya D. (held-beat
 * error semantics §4), Paul K. (error spec).
 */

'use client';

import {
  useEffect, useMemo, useReducer,
  type FocusEvent,
} from 'react';
import { useReducedMotionFlag } from '@/lib/utils/reduced-motion';
import {
  type FieldPhase,
  FIELD_ERROR_HOLD_MS,
  FIELD_ERROR_BUDGET_MS,
} from '@/lib/utils/field-phase';

// ─── Reducer — pure, trivially testable ────────────────────────────────────

export type FieldAction =
  | { type: 'FOCUS' }
  | { type: 'BLUR' }
  | { type: 'INVALIDATE' }
  | { type: 'CLEAR' };

/** Pure state transition. No timers, no DOM. */
export function fieldReducer(phase: FieldPhase, action: FieldAction): FieldPhase {
  if (action.type === 'INVALIDATE') return 'error-held';
  if (action.type === 'CLEAR') return phase === 'error-held' ? 'rest' : phase;
  if (action.type === 'FOCUS') return phase === 'error-held' ? phase : 'focus';
  if (action.type === 'BLUR') return phase === 'error-held' ? phase : 'rest';
  return phase;
}

// ─── Error-hold timer — decouples held beat from prop flip ────────────────

function useErrorHoldTimer(
  phase: FieldPhase,
  dispatch: React.Dispatch<FieldAction>,
  reduced: boolean,
): void {
  useEffect(() => {
    if (phase !== 'error-held') return;
    const ms = reduced ? 10 : FIELD_ERROR_HOLD_MS;
    const id = setTimeout(() => dispatch({ type: 'CLEAR' }), ms);
    return () => clearTimeout(id);
  }, [phase, dispatch, reduced]);
}

/** Safety net: if anything swallows CLEAR, force-rest within budget. */
function useErrorSafetyNet(
  phase: FieldPhase,
  dispatch: React.Dispatch<FieldAction>,
): void {
  useEffect(() => {
    if (phase !== 'error-held') return;
    const id = setTimeout(
      () => dispatch({ type: 'CLEAR' }),
      FIELD_ERROR_BUDGET_MS,
    );
    return () => clearTimeout(id);
  }, [phase, dispatch]);
}

// ─── Prop-driven invalidate — caller flips `invalid`, machine reacts ──────

function useInvalidateOnProp(
  invalid: boolean,
  dispatch: React.Dispatch<FieldAction>,
): void {
  useEffect(() => {
    if (invalid) dispatch({ type: 'INVALIDATE' });
    else dispatch({ type: 'CLEAR' });
  }, [invalid, dispatch]);
}

// ─── Handler factories — 2-3 LOC each ─────────────────────────────────────

interface Handlers {
  onFocus: (e: FocusEvent<HTMLElement>) => void;
  onBlur: (e: FocusEvent<HTMLElement>) => void;
}

function buildHandlers(dispatch: React.Dispatch<FieldAction>): Handlers {
  return {
    onFocus: () => dispatch({ type: 'FOCUS' }),
    onBlur: () => dispatch({ type: 'BLUR' }),
  };
}

// ─── Public hook ───────────────────────────────────────────────────────────

export interface UseFieldPhaseResult {
  phase: FieldPhase;
  reduced: boolean;
  handlers: Handlers;
}

/**
 * Wire the return value's `handlers` onto the input/textarea. `phase` +
 * `reduced` feed `resolveFieldStyle()` for the inline border-colour swap.
 *
 * `invalid` is read as a prop; caller does not dispatch directly.
 */
export function useFieldPhase(invalid: boolean = false): UseFieldPhaseResult {
  const [phase, dispatch] = useReducer(fieldReducer, 'rest');
  const reduced = useReducedMotionFlag();
  useInvalidateOnProp(invalid, dispatch);
  useErrorHoldTimer(phase, dispatch, reduced);
  useErrorSafetyNet(phase, dispatch);
  const handlers = useMemo(() => buildHandlers(dispatch), [dispatch]);
  return { phase, reduced, handlers };
}
