/**
 * useStateCrossing — detects thermal state deltas and emits crossing events.
 *
 * Pattern: prev-state ref comparison. First delta is skipped (page-load
 * restore guard — a returning reader's state restores from localStorage,
 * which is NOT a crossing the reader performed now).
 *
 * "No extra renders. No context updates. Just a ref delta." — Mike K.
 *
 * Usage: call inside any component that has access to ThermalProvider.
 *   const { state } = useThermal();
 *   useStateCrossing(state);
 *
 * Credits: Mike K. (prev-state ref pattern, mounted gate spec).
 */

'use client';

import { useRef, useEffect } from 'react';
import type { ThermalState } from '@/lib/thermal/thermal-score';
import { emitCrossing } from '@/lib/thermal/state-crossing';

/**
 * Detects thermal state crossing and emits window events for subscribers.
 * Must be called within ThermalProvider scope.
 *
 * @param currentState — live thermal state from useThermal().state
 */
export function useStateCrossing(currentState: ThermalState): void {
  const prevRef    = useRef<ThermalState>(currentState);
  const mountedRef = useRef(false);

  useEffect(() => {
    // First render: page-load restore sets initial state.
    // That is not a mid-reading crossing — skip it.
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevRef.current    = currentState;
      return;
    }

    if (prevRef.current !== currentState) {
      emitCrossing(prevRef.current, currentState);
      prevRef.current = currentState;
    }
  }, [currentState]);
}
