/**
 * useResonanceCeremony — 3-phase sequencing for resonance save.
 *
 * idle → shimmering → settled
 *
 * Simpler than CompletionShimmer's 6-phase ceremony because saving
 * a resonance is a single deliberate action, not accumulated behavior.
 *
 * Timing: shimmer fires immediately, settle at +1500ms.
 * The consumer (ResonanceDrawer) handles auto-close and success message.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ThermalState } from '@/lib/thermal/thermal-score';
import { CEREMONY } from '@/lib/design/motion';

export type ResonancePhase = 'idle' | 'shimmering' | 'settled';

/** Shimmer intensity derived from thermal state. */
export type ResonanceIntensity = 'subtle' | 'warm' | 'rich';

interface ResonanceCeremonyState {
  phase: ResonancePhase;
  intensity: ResonanceIntensity;
}

/** Map thermal state to shimmer intensity. */
function intensityFromThermal(state: ThermalState): ResonanceIntensity {
  if (state === 'warm' || state === 'luminous') return 'rich';
  if (state === 'stirring') return 'warm';
  return 'subtle';
}

/**
 * Ceremony timing constants for consumer choreography.
 * Sourced from `lib/design/motion.ts` CEREMONY namespace so every narrative
 * pacing on the site reads from one ledger. Names kept for call-site clarity.
 */
export const CEREMONY_TIMING = {
  T_SUCCESS: CEREMONY.tSuccess, // success message appears after shimmer start
  T_SETTLE:  CEREMONY.tSettle,  // all animations resolve
  T_CLOSE:   CEREMONY.tClose,   // drawer auto-closes
} as const;

export function useResonanceCeremony(
  thermalState: ThermalState,
  triggered: boolean,
  onSettled?: () => void,
): ResonanceCeremonyState {
  const [phase, setPhase] = useState<ResonancePhase>('idle');
  const fired = useRef(false);
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  const intensity = intensityFromThermal(thermalState);

  /** Reset ceremony state (called when drawer re-opens). */
  const reset = useCallback(() => {
    fired.current = false;
    setPhase('idle');
  }, []);

  // Suppress unused variable warning — reset is for consumers
  void reset;

  useEffect(() => {
    if (!triggered || fired.current) return;
    fired.current = true;

    // Phase 1: shimmer fires immediately
    setPhase('shimmering');

    // Phase 2: settled — animations resolve
    const t1 = setTimeout(() => {
      setPhase('settled');
      onSettledRef.current?.();
    }, CEREMONY_TIMING.T_SETTLE);

    return () => clearTimeout(t1);
  }, [triggered]);

  return { phase, intensity };
}
