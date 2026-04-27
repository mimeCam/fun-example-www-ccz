/**
 * ViaWhisper — "A Deep Diver sent you here" arrival whisper.
 *
 * Renders when a friend clicks a shared archetype deep link. Visible at
 * full intensity; after the canonical recognition silence (Mike napkin
 * §"Surgical adoption"), the cue dims to the muted register.
 *
 * The italic gold text speaks at the `quiet` rung (`text-gold/70`) — the
 * same address as `RecognitionWhisper` (return), `GemHome` at luminous
 * (wayfinding), and `EvolutionThread` (memory). Four surfaces, one
 * voice — the gold-whisper register. The rung is owned by the alpha
 * ledger; this file routes through `alphaClassOf` so a future re-tune
 * happens at one address. (Mike napkin #114, Tanya UIX #94 §2.)
 *
 * Timing — owned by the Recognition Timeline (Mike napkin §"Module shape").
 * The previous `T_LINGER = 6000ms` constant retired with this PR; the
 * cue now folds at the canonical `whisperTimeline()` dwell — eight
 * `linger` breaths followed by one `settle` retirement. ViaWhisper now
 * speaks the same dwell as the sister whispers; the Recognition Moment
 * sounds in one voice across the site.
 */
'use client';

import type { ArchetypeKey } from '@/types/content';
import { friendWhisperText } from '@/lib/sharing/deep-link';
import { gestureClassesOf } from '@/lib/design/gestures';
import { alphaClassOf } from '@/lib/design/alpha';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useRecognitionPhase } from '@/lib/hooks/useRecognitionPhase';
import { resolveRecognitionTimeline } from '@/lib/return/recognition-timeline';

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
  const reduce = useReducedMotion();
  const timeline = resolveRecognitionTimeline('whisper', { reducedMotion: reduce });
  const { phase } = useRecognitionPhase(timeline);
  const dimmed = phase === 'hold' || phase === 'fold';
  const text = friendWhisperText(via);

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
