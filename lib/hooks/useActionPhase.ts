/**
 * useActionPhase — minimal state machine for the semantic confirmation pulse.
 *
 * Mirrors `usePressPhase` discipline: a tiny reducer + a settle timer + a
 * safety-net budget. The hook owns *only* the resolved layer (idle ↔ settled);
 * external `busy` (the caller's "work in flight" boolean) merges into the
 * public phase. This keeps two concerns clean:
 *
 *   • mechanical (down/release) lives in `usePressPhase` — naive, untouched.
 *   • semantic   (work succeeded) lives here — composed.
 *
 * Caller pattern:
 *   const { phase, reduced, pulse } = useActionPhase(busy);
 *   async function run() {
 *     setBusy(true);
 *     const ok = await work();
 *     setBusy(false);
 *     pulse(ok);  // → 'settled' on true, → 'idle' on false (toast carries)
 *   }
 *
 * Reduced-motion (Tanya §5.6): the witness lands; only easing falls away.
 *
 * Credits: Mike K. (phase-machine pattern + safety net), Tanya D.
 * (~1200 ms dwell + reduced-motion contract), Elon M. (mechanical-vs-
 * semantic split), Krystle C. (original spec — fail-quiet covenant).
 */

'use client';

import {
  useCallback, useEffect, useReducer, useRef,
  type Dispatch,
} from 'react';
import {
  type ActionPhase, ACTION_HOLD_MS, ACTION_HOLD_BUDGET_MS,
} from '@/lib/utils/action-phase';
import { useReducedMotionFlag } from '@/lib/utils/reduced-motion';

// ─── Reducer — pure, trivially testable ────────────────────────────────────
//
// Internal state is the binary "did the work succeed and we are still
// holding the witness?" Phase ('idle'|'busy'|'settled') is composed at the
// hook boundary by merging this with the external `busy` flag.

type Resolved = 'idle' | 'settled';

export type ActionEvent =
  | { type: 'OK' }      // pulse(true)  — work resolved successfully
  | { type: 'FAIL' }    // pulse(false) — work failed; toast carries
  | { type: 'IDLE' };   // settle timer / safety-net forces decay

/** Pure transition. No timers, no DOM. */
export function actionReducer(state: Resolved, ev: ActionEvent): Resolved {
  if (ev.type === 'OK') return 'settled';
  if (ev.type === 'FAIL') return 'idle';
  if (ev.type === 'IDLE') return 'idle';
  return state;
}

// ─── Settle timer — auto-decay after ACTION_HOLD_MS ────────────────────────

function useSettleTimer(
  resolved: Resolved,
  dispatch: Dispatch<ActionEvent>,
): void {
  useEffect(() => {
    if (resolved !== 'settled') return;
    const id = setTimeout(() => dispatch({ type: 'IDLE' }), ACTION_HOLD_MS);
    return () => clearTimeout(id);
  }, [resolved, dispatch]);
}

/** Safety net: if anything swallows the timer, force-idle within budget. */
function useSettleSafetyNet(
  resolved: Resolved,
  dispatch: Dispatch<ActionEvent>,
): void {
  useEffect(() => {
    if (resolved !== 'settled') return;
    const id = setTimeout(() => dispatch({ type: 'IDLE' }),
      ACTION_HOLD_BUDGET_MS);
    return () => clearTimeout(id);
  }, [resolved, dispatch]);
}

// ─── Phase composition — external busy + internal resolved → ActionPhase ───

/** Pure: merge external busy with internal settled flag. Busy wins. */
export function composeActionPhase(busy: boolean, resolved: Resolved): ActionPhase {
  if (busy) return 'busy';
  return resolved;
}

// ─── Public hook ───────────────────────────────────────────────────────────

export interface UseActionPhaseResult {
  /** Composed phase: 'idle' | 'busy' | 'settled'. */
  phase: ActionPhase;
  /** Live reduced-motion flag. */
  reduced: boolean;
  /** Pulse the resolved layer with the work's outcome. */
  pulse: (ok: boolean) => void;
}

/**
 * Hook: idle → busy → settled → idle. Caller owns `busy`; pulse drives
 * the resolved layer.
 */
export function useActionPhase(busy: boolean = false): UseActionPhaseResult {
  const [resolved, dispatch] = useReducer(actionReducer, 'idle');
  const reduced = useReducedMotionFlag();
  const dispatchRef = useStableDispatch(dispatch);
  useSettleTimer(resolved, dispatch);
  useSettleSafetyNet(resolved, dispatch);
  const pulse = useCallback((ok: boolean) => {
    dispatchRef.current({ type: ok ? 'OK' : 'FAIL' });
  }, [dispatchRef]);
  return { phase: composeActionPhase(busy, resolved), reduced, pulse };
}

/** Stable ref to dispatch so `pulse` keeps a stable identity across renders. */
function useStableDispatch(
  dispatch: Dispatch<ActionEvent>,
): React.MutableRefObject<Dispatch<ActionEvent>> {
  const ref = useRef(dispatch);
  ref.current = dispatch;
  return ref;
}
