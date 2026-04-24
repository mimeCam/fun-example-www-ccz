/**
 * CeremonySequencer — choreographs the 4-phase completion ceremony.
 *
 * State machine: idle → breathing → warming → gifting → settled
 *
 * Streamlined from 7 phases to 4 active phases per Elon's critique and
 * Tanya's §4 spec. Removed: shimmering (redundant — CompletionShimmer
 * activates on 'warming' directly), glowing (redundant — GoldenThread
 * crossing burst covers mid-reading state arrivals).
 *
 * Total ceremony: ~2000ms (was ~3700ms).
 * "The ceremony doesn't make the site feel like it's congratulating itself." — Elon M.
 *
 * Credits: Mike K. (streamline architecture, 7→4 phases), Tanya D. (§4
 * three-act spec: Recognition → Presence → Invitation), Elon M. (critique
 * of shimmer/glow redundancy).
 */

'use client';

import { useState, useEffect, useRef, createContext, useContext, type ReactNode } from 'react';
import { ceremonyPlan, type TransitionPlan } from '@/lib/thermal/transition-choreography';
import { CEREMONY, MOTION } from '@/lib/design/motion';

/** Ceremony phases — four active states after idle. */
export type CeremonyPhase =
  | 'idle'       // nothing yet
  | 'breathing'  // 300ms inhale — the room takes a breath
  | 'warming'    // shimmer fires + thermal refresh
  | 'gifting'    // NextRead invitation appears
  | 'settled';   // ceremony complete

/**
 * Intensity tier derived from completion confidence.
 * Re-exported here for consumers; canonical definition lives in
 * lib/thermal/state-crossing.ts as CrossingIntensity (same shape).
 */
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

/**
 * Timing constants — sourced from MOTION/CEREMONY so the ledger stays
 * the single source of truth. No bare numeric literals.
 */
const T_BREATH     = CEREMONY.breath;    // 300ms — room inhales
const T_GIFT_DELAY = CEREMONY.giftDelay; // 700ms — NextRead invitation delay

export function CeremonySequencer({ triggered, confidence, onRefresh, children }: SequencerProps) {
  const [phase, setPhase] = useState<CeremonyPhase>('idle');
  const fired        = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const intensity = intensityFromConfidence(confidence);

  useEffect(() => {
    if (!triggered || fired.current) return;
    fired.current = true;

    // Act 1 — Recognition: breathing pause, then shimmer fires.
    setPhase('breathing');

    // Act 2 — Presence: warming triggers CompletionShimmer + thermal refresh.
    const t1 = setTimeout(() => {
      setPhase('warming');
      onRefreshRef.current(ceremonyPlan());
    }, T_BREATH);

    // Act 3 — Invitation: NextRead fades in.
    const t2 = setTimeout(() => setPhase('gifting'), T_BREATH + T_GIFT_DELAY);

    // Settled — ceremony resolved, keepsake stays accessible.
    const t3 = setTimeout(
      () => setPhase('settled'),
      T_BREATH + T_GIFT_DELAY + MOTION.linger,
    );

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [triggered]);

  const state: CeremonyState = { phase, intensity, confidence };

  return (
    <CeremonyContext.Provider value={state}>
      {children}
    </CeremonyContext.Provider>
  );
}
