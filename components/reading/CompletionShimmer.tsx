/**
 * CompletionShimmer — one-time gold wash on the final <hr>.
 *
 * Replaces the static divider when the reader genuinely finishes.
 * Gold shimmer sweeps left-to-right, one cycle, then stops.
 * Thermal-aware: subtle at dormant, full gold at stirring+.
 * Respects reduced-motion: static gold/30 border instead.
 */

'use client';

interface CompletionShimmerProps {
  /** True when genuine reading completion is detected. */
  active: boolean;
}

export function CompletionShimmer({ active }: CompletionShimmerProps) {
  if (!active) {
    // Pre-ceremony: static divider, no animation
    return <hr className="border-gold/10 my-sys-8" />;
  }

  return (
    <div
      className="my-sys-8 completion-shimmer"
      role="separator"
      aria-label="Article complete"
    >
      <div className="completion-shimmer-track" />
    </div>
  );
}
