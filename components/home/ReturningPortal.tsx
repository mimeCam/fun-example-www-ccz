/**
 * ReturningPortal — client wrapper that positions ReturnLetter
 * in the Portal (homepage) context.
 *
 * Renders `ReturnLetter` only when the shared recognition-surface
 * selector returns `letter`. Strangers, deep-link arrivals (`?via=`),
 * and 7-day-dismissed readers all collapse to a zero-height shell —
 * the Whisper is the article-rail rendezvous, not the home-rail one.
 *
 * The `?via=` deep-link case is now ALSO honored at the selector layer
 * (Mike §6.3): pass the decoded `via` archetype in and the selector
 * route-routes to `whisper` instead of `letter`. `app/page.tsx` still
 * skips mounting this portal for the via-case to avoid the paint-time
 * silence (Tanya §3.2 Finding A) — the selector check is belt-and-
 * suspenders for any future shell that mounts both rails.
 *
 * Client-only (reads localStorage via the hook + dismissed helper).
 * Always imported via `dynamic()` with `{ ssr: false }`.
 */

'use client';

import dynamic from 'next/dynamic';
import type { ArchetypeKey } from '@/types/content';
import { useReturnRecognition } from '@/lib/hooks/useReturnRecognition';
import {
  pickRecognitionSurface,
  readLetterDismissed,
} from '@/lib/return/recognition-surface';

const ReturnLetter = dynamic(
  () => import('@/components/return/ReturnLetter').then(m => ({ default: m.ReturnLetter })),
  { ssr: false }
);

interface Props {
  /** Decoded archetype from `?via=`, when present. Routed in by `app/page.tsx`. */
  via?: ArchetypeKey | null;
}

export default function ReturningPortal({ via = null }: Props) {
  const recognition = useReturnRecognition();
  const surface = pickRecognitionSurface({
    surface: 'home',
    recognition,
    viaArchetype: via,
    letterDismissed: readLetterDismissed(),
  });

  // Selector is the single arbiter — only render when it says `letter`.
  // The Whisper case is handled on the article rail; the silent case is
  // truly silent (no ghost margin, hero stays unchanged).
  if (surface !== 'letter') return null;

  return (
    <div className="mb-sys-8 animate-fade-in">
      <ReturnLetter />
    </div>
  );
}
