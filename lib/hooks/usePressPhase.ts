/**
 * usePressPhase — minimal state machine for tactile press feedback.
 *
 * Owns the `idle → down → settling → idle` transitions and provides the
 * event handlers to wire onto a `<button>`. Keeps the reducer simple so
 * the pure resolvers in `press-phase.ts` carry all the style math.
 *
 * Space/Enter keyboard → treated as press (native `<button>` semantics).
 * Blur / pointerleave → cancel a mid-press without firing release.
 * Reduced motion → the opacity-only branch from `resolvePressStyle()`.
 *
 * Credits: Mike K. (phase-machine pattern), Tanya D. (release timing),
 * Krystle C. (keyboard parity requirement).
 */

'use client';

import {
  useEffect, useMemo, useReducer, useRef, useState,
  type KeyboardEvent, type PointerEvent,
} from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/utils/use-isomorphic-layout-effect';
import {
  type PressPhase, PRESS_SETTLE_MS, PRESS_SETTLE_BUDGET_MS,
} from '@/lib/utils/press-phase';

// ─── Reducer — pure, trivially testable ────────────────────────────────────

export type PressAction =
  | { type: 'DOWN' }
  | { type: 'UP' }
  | { type: 'CANCEL' }
  | { type: 'SETTLED' };

/** Pure state transition. No timers, no DOM. */
export function pressReducer(phase: PressPhase, action: PressAction): PressPhase {
  if (action.type === 'DOWN') return 'down';
  if (action.type === 'UP') return phase === 'down' ? 'settling' : phase;
  if (action.type === 'CANCEL') return 'idle';
  if (action.type === 'SETTLED') return phase === 'settling' ? 'idle' : phase;
  return phase;
}

// ─── Reduced-motion probe — same pattern as Threshold ──────────────────────

function readReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function useReducedMotionFlag(): boolean {
  const [flag, setFlag] = useState(false);
  useIsomorphicLayoutEffect(() => {
    setFlag(readReducedMotion());
    return subscribe(setFlag);
  }, []);
  return flag;
}

function subscribe(cb: (v: boolean) => void): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (e: MediaQueryListEvent) => cb(e.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}

// ─── Settle timer — decouples `settling` from its animation end ────────────

function useSettleTimer(
  phase: PressPhase,
  dispatch: React.Dispatch<PressAction>,
  reduced: boolean,
): void {
  useEffect(() => {
    if (phase !== 'settling') return;
    const ms = reduced ? 10 : PRESS_SETTLE_MS;
    const id = setTimeout(() => dispatch({ type: 'SETTLED' }), ms);
    return () => clearTimeout(id);
  }, [phase, dispatch, reduced]);
}

/** Safety net: if anything swallows SETTLED, force-idle within budget. */
function useSettleSafetyNet(
  phase: PressPhase,
  dispatch: React.Dispatch<PressAction>,
): void {
  useEffect(() => {
    if (phase !== 'settling') return;
    const id = setTimeout(() => dispatch({ type: 'SETTLED' }),
      PRESS_SETTLE_BUDGET_MS);
    return () => clearTimeout(id);
  }, [phase, dispatch]);
}

// ─── Event handler factories — small, pure per call ───────────────────────

function isActivationKey(key: string): boolean {
  return key === ' ' || key === 'Enter' || key === 'Spacebar';
}

interface Handlers {
  onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLElement>) => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  onKeyUp: (e: KeyboardEvent<HTMLElement>) => void;
  onBlur: () => void;
}

interface EdgeActions {
  down: () => void;
  up: () => void;
  cancel: () => void;
}

function buildEdges(
  dispatch: React.Dispatch<PressAction>,
  disabled: boolean,
  pressedRef: React.MutableRefObject<boolean>,
): EdgeActions {
  return {
    down: () => { if (!disabled) { pressedRef.current = true; dispatch({ type: 'DOWN' }); } },
    up: () => { if (pressedRef.current) { pressedRef.current = false; dispatch({ type: 'UP' }); } },
    cancel: () => { if (pressedRef.current) { pressedRef.current = false; dispatch({ type: 'CANCEL' }); } },
  };
}

function buildHandlers(
  dispatch: React.Dispatch<PressAction>,
  disabled: boolean,
  pressedRef: React.MutableRefObject<boolean>,
): Handlers {
  const { down, up, cancel } = buildEdges(dispatch, disabled, pressedRef);
  return {
    onPointerDown: (e) => { if (e.button === 0) down(); },
    onPointerUp: () => up(),
    onPointerLeave: () => cancel(),
    onPointerCancel: () => cancel(),
    onKeyDown: (e) => { if (isActivationKey(e.key) && !e.repeat) down(); },
    onKeyUp: (e) => { if (isActivationKey(e.key)) up(); },
    onBlur: () => cancel(),
  };
}

// ─── Public hook ───────────────────────────────────────────────────────────

export interface UsePressPhaseResult {
  phase: PressPhase;
  reduced: boolean;
  handlers: Handlers;
}

/**
 * Wire the return value's `handlers` onto a native `<button>`. `phase` +
 * `reduced` feed `resolvePressStyle()` for the inline style. No other work.
 */
export function usePressPhase(disabled: boolean = false): UsePressPhaseResult {
  const [phase, dispatch] = useReducer(pressReducer, 'idle');
  const reduced = useReducedMotionFlag();
  const pressedRef = useRef(false);
  useSettleTimer(phase, dispatch, reduced);
  useSettleSafetyNet(phase, dispatch);
  const handlers = useStableHandlers(dispatch, disabled, pressedRef);
  return { phase, reduced, handlers };
}

function useStableHandlers(
  dispatch: React.Dispatch<PressAction>,
  disabled: boolean,
  pressedRef: React.MutableRefObject<boolean>,
): Handlers {
  return useMemo(
    () => buildHandlers(dispatch, disabled, pressedRef),
    [dispatch, disabled, pressedRef],
  );
}
