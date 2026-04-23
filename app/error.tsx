/**
 * Thermal error boundary — the room doesn't break, it just shifts
 * (threshold-error surface).
 *
 * Next.js error.tsx convention (client component). Inherits thermal tokens
 * from `:root` (set by the blocking script), so the error page feels like
 * the same warm room, not a cold ejection.
 *
 * All layout + tone discipline lives in `<EmptySurface />` (the 7th shared
 * primitive). The real feature here is the reset button (Elon §3.5) — the
 * primary slot wires straight to Next's error-boundary `reset()` via the
 * button-shaped `EmptySurfaceAction`. The secondary link escape-hatches to
 * the Threshold in case retry won't help.
 */

'use client';

import { EmptySurface } from '@/components/shared/EmptySurface';
import { emptyPhrase } from '@/lib/sharing/empty-phrase';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { headline, whisper } = emptyPhrase('threshold-error');
  return (
    <EmptySurface
      kind="threshold-error"
      headline={headline}
      whisper={whisper}
      primary={{ kind: 'button', onClick: reset, label: 'Try again →' }}
      secondary={{ href: '/', label: 'Return to the Threshold' }}
      tint="none"
    />
  );
}
