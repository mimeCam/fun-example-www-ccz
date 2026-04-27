/**
 * EvolutionThread — narrator whisper between resonance entries.
 *
 * The blog reading the reader's own history back. Voice is the only voice:
 * `synthesizeBookWhisper(context)` — never one of three canned phrases. When
 * the synthesizer has nothing to say, the whisper is silence — the component
 * returns null. (Tanya UX §3.3 — "a whisper that has nothing to say is
 * silence, not boilerplate"; Paul MH-6 generalized — when the system can't
 * recognize the reader, it fails silently and politely.)
 *
 * Tile chrome (Tanya UX §3.1): a single hairline `border-l-2 border-gold/20`
 * running down the page's spine — the same gold thread the chapter-break
 * hairline and carrying-section divider already use. No fill, no rounded
 * corners, no posture lie. The italic gold/70 line IS the whole flag.
 *
 * Motion: rides the same scroll-rise wave as `ResonanceEntry` — one
 * IntersectionObserver, one stagger, one breath (Tanya UX §3.2). The verb
 * `whisper-linger` (Mike napkin #91 — verb #13, the room exhaling) names
 * the breath; the migration receipt redeems EvolutionThread off
 * `GESTURE_GRANDFATHERED_PATHS` and joins the four-site rhythm fence
 * (`ViaWhisper`, `RecognitionWhisper`, `GemHome`, this file).
 *
 * Felt sentence: *"the room exhales a thought it doesn't quite say —
 * present, then dim."* If the implementation cannot read that line aloud
 * honestly, it is wrong before the pixels are wrong.
 *
 * Credits: Tanya D. (UIX spec — fold-into-existing-tokens tile chrome,
 * scroll-rise wave coherence, null-on-silence guard, the "blog reading you
 * back" property promoted into code), Mike K. (architect napkin #91 —
 * `whisper-linger` migration receipt + four-site rhythm fence), Paul K.
 * (MH-6 silent-recognition stance), Elon M. (the three real polish
 * targets — styling island, bare-timer fade, legacy switch — promoted
 * to spec; cosmology declined).
 */
'use client';

import { type RefObject } from 'react';
import type { BookNarrationContext } from '@/types/book-narration';
import { synthesizeBookWhisper } from '@/lib/mirror/book-whisper-engine';
import { useScrollRise } from '@/lib/hooks/useScrollRise';
import { gestureClassesOf } from '@/lib/design/gestures';

interface Props {
  /** Data-driven context from resonance signals. Required — no fallback voice. */
  context: BookNarrationContext;
  /** Position in the carrying loop — drives the scroll-rise stagger. */
  index: number;
}

export default function EvolutionThread({ context, index }: Props) {
  const { ref } = useScrollRise({ index });
  const whisper = synthesizeBookWhisper(context);
  if (!whisper) return null;

  return (
    // alpha-ledger:exempt — motion fade endpoint (the rise keyframe owns the opacity transition)
    <div
      ref={ref as RefObject<HTMLDivElement>}
      className={`pl-sys-5 my-sys-7 border-l-2 border-gold/20 transition-opacity ${gestureClassesOf('whisper-linger')}`}
    >
      <p className="text-gold/70 italic text-sys-caption typo-caption">
        {whisper}
      </p>
    </div>
  );
}
