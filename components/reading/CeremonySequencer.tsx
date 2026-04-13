/**
 * CeremonySequencer — choreographs the 5-step completion ceremony.
 *
 * State machine: idle → breathing → shimmering → glowing → warming → gifting → settled
 *
 * The ceremony is the product's thesis made tangible:
 * "reading is rewarded, skimming is not."
 *
 * Each phase emits a signal that subscribers react to.
 * The 300ms breath pause creates the feeling that the room
 * *responded*, not *reacted*.
 */

'use client';

import { useState, useEffect, useRef, useCallback, createContext, useContext, type ReactNode } from 'react';
import { ceremonyPlan, type TransitionPlan } from '@/lib/thermal/transition-choreography';

/** Ceremony phases — each maps to a specific visual response. */
export type CeremonyPhase =
  | 'idle'        // nothing yet
  | 'breathing'   // 300ms pause — the room takes a breath
  | 'shimmering'  // gold sweep fires (duration varies by confidence)
  | 'glowing'     // GoldenThread pulses gold
  | 'warming'     // thermal refresh — room visibly warms
  | 'gifting'     // NextRead fades in
  | 'settled';    // ceremony complete

/** Intensity tier derived from completion confidence score. */
export type CeremonyIntensity = 'subtle' | 'present' | 'radiant';

/** Context value for ceremony subscribers. */
export interface CeremonyState {
  phase: CeremonyPhase;
  intensity: CeremonyIntensity;
  confidence: number;
}

/** Derive intensity tier from confidence (70-100). */
export function intensityFromConfidence(confidence: number): CeremonyIntensity {
  if (confidence >= 90) return 'radiant';
  if (confidence >= 80) return 'present';
  return 'subtle';
}

const CeremonyContext = createContext<CeremonyState>({
  phase: 'idle',
  intensity: 'subtle',
  confidence: 0,
});

export function useCeremony(): CeremonyState {
  return useContext(CeremonyContext);
}

interface SequencerProps {
  /** Whether a genuine completion has been detected. */
  triggered: boolean;
  /** Confidence score (70-100). Drives intensity tier. */
  confidence: number;
  /** Callback to fire thermal refresh during warming phase. */
  onRefresh: (plan?: TransitionPlan) => void;
  children: ReactNode;
}

/** Timing constants — the choreography. */
const T_BREATH = 300;    // ms — anticipation pause before shimmer
const T_SHIMMER = 700;   // ms — base shimmer duration (varies by intensity)
const T_GLOW_HOLD = 2000; // ms — GoldenThread gold burst hold
const T_GIFT_DELAY = 700;  // ms — after shimmer, NextRead appears

export function CeremonySequencer({ triggered, confidence, onRefresh, children }: SequencerProps) {
  const [phase, setPhase] = useState<CeremonyPhase>('idle');
  const fired = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const intensity = intensityFromConfidence(confidence);

  /** Shimmer duration scales with intensity. */
  const shimmerDuration = intensity === 'radiant' ? 900 : intensity === 'present' ? 700 : 500;

  /** Advance to next phase with a timeout. */
  const advanceAfter = useCallback((next: CeremonyPhase, ms: number) => {
    const id = setTimeout(() => setPhase(next), ms);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!triggered || fired.current) return;
    fired.current = true;

    // Phase 1: the room takes a breath
    setPhase('breathing');

    // Phase 2: shimmer fires after breath pause
    const t1 = setTimeout(() => setPhase('shimmering'), T_BREATH);

    // Phase 3: golden thread glows (overlaps with shimmer end)
    const t2 = setTimeout(() => setPhase('glowing'), T_BREATH);

    // Phase 4: thermal refresh — room warms with ceremony choreography.
    // The ceremony plan adds staggered delays (200ms, 300ms, 500ms)
    // creating the "room settling in stages" effect.
    const t3 = setTimeout(() => {
      setPhase('warming');
      onRefreshRef.current(ceremonyPlan());
    }, T_BREATH + shimmerDuration);

    // Phase 5: NextRead gift appears
    const t4 = setTimeout(
      () => setPhase('gifting'),
      T_BREATH + shimmerDuration + T_GIFT_DELAY
    );

    // Settled — ceremony complete
    const t5 = setTimeout(
      () => setPhase('settled'),
      T_BREATH + shimmerDuration + T_GIFT_DELAY + T_GLOW_HOLD
    );

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [triggered, shimmerDuration]);

  const state: CeremonyState = { phase, intensity, confidence };

  return (
    <CeremonyContext.Provider value={state}>
      {children}
    </CeremonyContext.Provider>
  );
}
