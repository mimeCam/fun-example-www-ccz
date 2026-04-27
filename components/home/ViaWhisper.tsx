/**
 * ViaWhisper — "A Deep Diver sent you here" arrival whisper.
 *
 * Renders when a friend clicks a shared archetype deep link.
 * Fades in over 1s, stays for 6s, then fades to 30% opacity.
 *
 * The italic gold text speaks at the `quiet` rung (`text-gold/70`) — the
 * same address as `RecognitionWhisper` (return), `GemHome` at luminous
 * (wayfinding), and `EvolutionThread` (memory). Four surfaces, one
 * voice — the gold-whisper register. The rung is owned by the alpha
 * ledger; this file routes through `alphaClassOf` so a future re-tune
 * happens at one address. (Mike napkin #114, Tanya UIX #94 §2.)
 */
'use client';

import { useState, useEffect } from 'react';
import type { ArchetypeKey } from '@/types/content';
import { friendWhisperText } from '@/lib/sharing/deep-link';
import { gestureClassesOf } from '@/lib/design/gestures';
import { alphaClassOf } from '@/lib/design/alpha';

/** Time before the whisper dims (2 × linger — this is a greeting, not ambient). */
const T_LINGER = 6000;

/* ─── Alpha-ledger handle (JIT-safe literal via alphaClassOf) ──────────────
   The arrival whisper paints at the `quiet` rung — same address as the
   sister whispers (`RecognitionWhisper` archetype label sits one rung
   deeper at `recede` by intent; the body of every other gold-italic
   whisper resolves here). Mirrors `EvolutionThread.HAIRLINE_BORDER` and
   `MirrorRevealCard.BORDER_HAIRLINE` shape — module-scope constant,
   surfaced via `__testing__` for the per-file SSR pin. */
const WHISPER_TEXT = alphaClassOf('gold', 'quiet', 'text'); // text-gold/70

interface Props {
  via: ArchetypeKey;
}

export default function ViaWhisper({ via }: Props) {
  const [dimmed, setDimmed] = useState(false);
  const text = friendWhisperText(via);

  useEffect(() => {
    const id = setTimeout(() => setDimmed(true), T_LINGER);
    return () => clearTimeout(id);
  }, []);

  return (
    // alpha-ledger:exempt — motion fade endpoint (opacity-100 is the visible transition target)
    <p className={`text-center text-sys-caption transition-opacity ${gestureClassesOf('whisper-linger')} mb-sys-4
      ${dimmed ? 'opacity-muted' : 'opacity-100'}`}>
      <span className={`${WHISPER_TEXT} italic`}>{text}</span>
    </p>
  );
}

/**
 * Test seam — exposes the module-scope alpha-ledger handle so the per-file
 * adoption test can assert the rung tag without spinning up a renderer for
 * every assertion. Mirrors the `__testing__` idiom on `EvolutionThread`,
 * `MirrorRevealCard`, and `ResonanceEntry` (Mike napkin #19 §5; #111 §4.1;
 * #113 §6 PoI #3).
 */
export const __testing__ = { WHISPER_TEXT } as const;
