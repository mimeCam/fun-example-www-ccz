/**
 * useMirrorPhases — 5-phase animation state machine for mirror reveal cards.
 *
 * Phases: hidden → emergence → shimmer → reveal → rest
 * Both QuickMirrorCard and MirrorRevealCard share this logic.
 * Reduced-motion: instant jump to 'rest' (no ceremony).
 *
 * @param timings — phase transition timestamps (ms from mount).
 * @param shareDelay — ms after rest phase to show share actions.
 */

'use client';

import { useState, useEffect } from 'react';

export type Phase = 'hidden' | 'emergence' | 'shimmer' | 'reveal' | 'rest';

export interface MirrorPhaseTimings {
  emerge: number;
  shimmer: number;
  reveal: number;
  rest: number;
  shareDelay: number;
}

/** Default timings for the inline QuickMirrorCard (reflective, generous). */
export const QUICK_TIMINGS: MirrorPhaseTimings = {
  emerge: 0,
  shimmer: 800,
  reveal: 2000,
  rest: 4000,
  shareDelay: 1200,
};

/** Default timings for the mirror-page MirrorRevealCard (faster, reader chose this). */
export const MIRROR_PAGE_TIMINGS: MirrorPhaseTimings = {
  emerge: 0,
  shimmer: 400,
  reveal: 1200,
  rest: 2500,
  shareDelay: 600,
};

export function useMirrorPhases(timings: MirrorPhaseTimings): {
  phase: Phase;
  showContent: boolean;
  showShares: boolean;
} {
  const [phase, setPhase] = useState<Phase>('hidden');
  const [showShares, setShowShares] = useState(false);

  useEffect(() => {
    // Reduced-motion: skip ceremony, jump to rest
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('rest');
      setShowShares(true);
      return;
    }

    const ids = [
      setTimeout(() => setPhase('emergence'), timings.emerge),
      setTimeout(() => setPhase('shimmer'), timings.shimmer),
      setTimeout(() => setPhase('reveal'), timings.reveal),
      setTimeout(() => setPhase('rest'), timings.rest),
      setTimeout(() => setShowShares(true), timings.rest + timings.shareDelay),
    ];
    return () => ids.forEach(clearTimeout);
  }, [timings]);

  const showContent = phase === 'reveal' || phase === 'rest';
  return { phase, showContent, showShares };
}
