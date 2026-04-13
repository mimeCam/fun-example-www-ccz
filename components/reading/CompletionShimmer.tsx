/**
 * CompletionShimmer — one-time gold wash on the final <hr>.
 *
 * Replaces the static divider when the reader genuinely finishes.
 * Gold shimmer sweeps left-to-right, one cycle, then stops.
 * Intensity varies by confidence: subtle / present / radiant.
 * Respects reduced-motion: static gold/30 border instead.
 */

'use client';

import { useCeremony, type CeremonyIntensity } from './CeremonySequencer';

/** Map intensity tier to CSS class. */
const INTENSITY_CLASS: Record<CeremonyIntensity, string> = {
  subtle: 'ceremony-subtle',
  present: 'ceremony-present',
  radiant: 'ceremony-radiant',
};

export function CompletionShimmer() {
  const { phase, intensity } = useCeremony();

  if (phase === 'idle' || phase === 'breathing') {
    return <hr className="border-gold/10 my-sys-8" />;
  }

  return (
    <div
      className={`my-sys-8 completion-shimmer ${INTENSITY_CLASS[intensity]}`}
      role="separator"
      aria-label="Article complete"
    >
      <div className="completion-shimmer-track" />
    </div>
  );
}
