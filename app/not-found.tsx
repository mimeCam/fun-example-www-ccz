/**
 * The Lost Door — Custom 404 page (threshold-404 surface).
 *
 * When a reader wanders off the path, they find a gentle threshold
 * back into the experience. Same atmospheric palette, same voice.
 * No harsh "ERROR 404" — just a quiet redirect.
 *
 * All layout + tone discipline lives in `<EmptySurface />` (the 7th
 * shared primitive). This file supplies only the per-room divergences:
 * the destination of the primary action and the secondary link. Both
 * headline and whisper flow through the lexicon via
 * `emptyPhrase('threshold-404')` (Mike §3 item #4, Tanya §2).
 */

import { EmptySurface } from '@/components/shared/EmptySurface';
import { emptyPhrase } from '@/lib/sharing/empty-phrase';

export default function NotFound() {
  const { headline, whisper } = emptyPhrase('threshold-404');
  return (
    <EmptySurface
      kind="threshold-404"
      headline={headline}
      whisper={whisper}
      primary={{ kind: 'link', href: '/', label: 'Return to the Threshold →' }}
      secondary={{ href: '/articles', label: 'Or browse articles' }}
      tint="cyan"
    />
  );
}
