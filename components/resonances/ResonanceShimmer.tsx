/**
 * ResonanceShimmer — gold border shimmer on the saved quote card.
 *
 * When a resonance is saved, the quote preview's border sweeps gold
 * left-to-right, then settles to a warm gold/40 border.
 *
 * Intensity scales with thermal state (subtle/warm/rich).
 * Respects reduced-motion: static gold border, no animation.
 */

'use client';

import type { ResonanceIntensity } from '@/lib/hooks/useResonanceCeremony';

interface ResonanceShimmerProps {
  intensity: ResonanceIntensity;
  active: boolean;
  children: React.ReactNode;
}

/** Map intensity to CSS class. */
const INTENSITY_CLASS: Record<ResonanceIntensity, string> = {
  subtle: 'resonance-shimmer--subtle',
  warm:   'resonance-shimmer--warm',
  rich:   'resonance-shimmer--rich',
};

export function ResonanceShimmer({
  intensity, active, children,
}: ResonanceShimmerProps) {
  if (!active) return <>{children}</>;

  return (
    <div className={`resonance-shimmer ${INTENSITY_CLASS[intensity]}`}>
      {children}
      <div className="resonance-shimmer-sweep" aria-hidden="true" />
    </div>
  );
}
