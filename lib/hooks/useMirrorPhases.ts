/**
 * useMirrorPhases — 5-phase animation state machine for the mirror reveal card.
 *
 * Phases: hidden → emergence → shimmer → reveal → rest.
 *
 * Singular consumer today: `MirrorRevealCard` on `/mirror` (it reads
 * `MIRROR_PAGE_TIMINGS`). The cold and warm branches of the page both
 * route through the same component with the same cadence — the reader
 * sees one card, one breath. (Pre-cycle `QuickMirrorCard` and its
 * companion `QUICK_TIMINGS` row were retired in Sid's "One Mirror, One
 * Room" pass; the inline reveal had already been removed from the
 * article flow.)
 *
 * Reduced-motion: instant jump to 'rest' AND `showShares = true` in the
 * same effect tick — no perceived stagger when the reader has asked the
 * room to be still (Tanya UX §4 "share-row stagger floor").
 *
 * @param timings — phase transition timestamps (ms from mount).
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
