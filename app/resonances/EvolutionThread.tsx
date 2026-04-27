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
 * Tile chrome (Tanya UX §3.1, Mike napkin #113): a single hairline
 * `border-l-2 border-gold/10` (= `alphaClassOf('gold','hairline','border')`)
 * running down the page's spine — the same gold thread `Divider.Static` and
 * `MirrorRevealCard`'s `BORDER_HAIRLINE` already speak. No fill, no rounded
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
import { alphaClassOf } from '@/lib/design/alpha';
import { gestureClassesOf } from '@/lib/design/gestures';

/* ─── Alpha-ledger handle (JIT-safe literal via alphaClassOf) ──────────────
   Same shape as `Divider.HAIRLINE_BG` and `MirrorRevealCard.BORDER_HAIRLINE`.
   Sister surfaces, one rung, one address — the whisper line and the section
   divider above/below it now paint at the same `hairline` rung
   (= `border-gold/10`). Mike napkin #113, Tanya UIX #54 §3 — "one filament,
   one voice." */
const HAIRLINE_BORDER = alphaClassOf('gold', 'hairline', 'border'); // border-gold/10

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
      className={`pl-sys-5 my-sys-7 border-l-2 ${HAIRLINE_BORDER} transition-opacity ${gestureClassesOf('whisper-linger')}`}
    >
      <p className="text-gold/70 italic text-sys-caption typo-caption">
        {whisper}
      </p>
    </div>
  );
}

/**
 * Test seam — exposes the module-scope alpha-ledger handle so the per-file
 * adoption test can assert the rung tag without spinning up a renderer for
 * every assertion. Mirrors the `__testing__` idiom on `MirrorRevealCard`
 * and `ResonanceEntry` (Mike napkin #19 §5; #111 §4.1).
 */
export const __testing__ = { HAIRLINE_BORDER } as const;
