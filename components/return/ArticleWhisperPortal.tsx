/**
 * ArticleWhisperPortal — mounts `RecognitionWhisper` on the article
 * surface, gated by the shared recognition-surface selector.
 *
 * The component itself is "dumb": it reads the recognition state, asks
 * the selector, and either renders the Whisper or returns `null`. The
 * mutual-exclusion invariant with `ReturnLetter` is enforced upstream
 * by the selector and by the route-level split — this portal only
 * paints when the selector says `whisper`.
 *
 * Layout (Tanya §2): the Whisper sits in the *coda margin*, below
 * NextRead and above WhisperFooter, inside the same `max-w-prose`
 * column as the article body. No card, no shadow, no radius — a single
 * italic line. The portal's wrapper exists only to:
 *   – hold the `mt-sys-10` / `mb-sys-8` breathing room (Tanya §2.2),
 *   – center the line in the prose column,
 *   – collapse to zero height for non-returning readers (no ghost margin).
 *
 * Client-only (the hook reads localStorage). Always imported from
 * `app/article/[id]/page.tsx` via `next/dynamic` with `{ ssr: false }`,
 * mirroring the `ReturningPortal` pattern.
 *
 * Credits: Mike Koch (architect §4 — portal shape, selector adoption),
 * Tanya Donska (UIX §2 — coda slot, "the line is the feature").
 */

'use client';

import { useReturnRecognition } from '@/lib/hooks/useReturnRecognition';
import { RecognitionWhisper } from '@/components/return/RecognitionWhisper';
import {
  pickRecognitionSurface,
  readLetterDismissed,
} from '@/lib/return/recognition-surface';

/**
 * Inner client component — exported separately so SSR adoption tests
 * can render it directly with `react-dom/server` (the dynamic wrapper
 * below short-circuits to `null` server-side, which would silence the
 * test). The hook returns its INITIAL state in SSR, so the rendered
 * verdict is `silent` for any unauthenticated/unhydrated reader. That
 * is the desired contract.
 */
export function ArticleWhisperPortalInner() {
  const recognition = useReturnRecognition();
  const surface = pickRecognitionSurface({
    surface: 'article',
    recognition,
    // Article surface ignores `via` and `letterDismissed` (see truth
    // table) — we still pass them so the selector signature stays the
    // single contract, and so a future refactor that hoists shared
    // gating doesn't need to touch this site.
    viaArchetype: null,
    letterDismissed: readLetterDismissed(),
  });

  if (surface !== 'whisper') return null;

  // Tanya §2.2 — direct child of the article column. The wrapper carries
  // ONLY breathing room; no container, no border, no shadow.
  return (
    <div className="mt-sys-10 mb-sys-8 text-center">
      <RecognitionWhisper recognition={recognition} />
    </div>
  );
}

export default ArticleWhisperPortalInner;
