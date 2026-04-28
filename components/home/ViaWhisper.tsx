/**
 * ViaWhisper — "A Deep Diver sent you here" arrival whisper.
 *
 * Renders when a friend clicks a shared archetype deep link. Mounts at
 * the rest rung (the kernel-owned silence) and lifts on the same breath
 * as the article-rail whisper (`liftMs = MOTION.settle = 1500ms`); after
 * the canonical recognition dwell the cue dims to the muted register.
 *
 * Two surfaces converge here; a third joins when it earns it. The italic
 * gold body speaks at the `quiet` rung (`text-gold/70`) — same address as
 * `RecognitionWhisper`'s body. Tanya UIX #79 §2.1 adjudicated the rung:
 * `quiet`, not `100`, because painting the wrapper at full would stack
 * element opacity on top of the alpha-ledger color alpha (double
 * attenuation) and the whisper would compete with the article body.
 * The wrapper steps back; the gold body color speaks. (Mike napkin #115
 * §"Whisper Opacity Convergence"; Tanya UIX #79 §2.1.)
 *
 * Phase → opacity rung mapping is owned by `lib/return/recognition-paint.ts`
 * (sibling to the timing kernel). Both whisper surfaces resolve the same
 * string per phase — the "one voice" claim is now a unit test, not a
 * docblock (`lib/return/__tests__/whisper-paint-converges.fence.test.ts`).
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
import { useThermal } from '@/components/thermal/ThermalProvider';
import { resolveRecognitionTimeline } from '@/lib/return/recognition-timeline';
import { phaseOpacityClass } from '@/lib/return/recognition-paint';
import { wrapClassOf } from '@/lib/design/typography';

/* ─── Alpha-ledger handle (JIT-safe literal via alphaClassOf) ──────────────
   The arrival whisper paints at the `quiet` rung — same address as the
   sister whispers (`RecognitionWhisper` archetype label sits one rung
   deeper at `recede` by intent; the body of every other gold-italic
   whisper resolves here). Mirrors `EvolutionThread.HAIRLINE_BORDER` and
   `MirrorRevealCard.BORDER_HAIRLINE` shape — module-scope constant,
   surfaced via `__testing__` for the per-file SSR pin. */
const WHISPER_TEXT = alphaClassOf('gold', 'quiet', 'text'); // text-gold/70

/* ─── Whisper wrap policy (Mike #122 §4) ────────────────────────────────
   Sister-surface parity with `RecognitionWhisper` and `MirrorRevealCard
   .WhisperQuote`: the deep-link arrival whisper breaks ragged-balanced
   regardless of viewport — no orphan word at 320px. The literal
   `typo-wrap-heading` lives once in the typography ledger; this surface
   consumes it. The convergence fence enforces "three sites, one literal,
   zero local `text-wrap-*` spellings." */
const WHISPER_WRAP = wrapClassOf('heading');

interface Props {
  via: ArchetypeKey;
}

export default function ViaWhisper({ via }: Props) {
  const reduce = useReducedMotion();
  // Recognition Cadence (Mike napkin §"Module shape", Tanya UIX §1.1):
  // thread `state` so the deep-link greeting inherits the same approach
  // tempo as its sister whisper on the article rail. Both doors speak
  // the same opening breath — pinned in
  // `whisper-surfaces-share-timeline.fence.test.ts`.
  const { state: thermalState } = useThermal();
  const timeline = resolveRecognitionTimeline('whisper', {
    reducedMotion: reduce, thermal: thermalState,
  });
  const { phase } = useRecognitionPhase(timeline);
  const text = friendWhisperText(via);

  return (
    <p className={`text-center text-sys-caption transition-opacity ${gestureClassesOf('whisper-linger')} mb-sys-4 ${WHISPER_WRAP} ${phaseOpacityClass(phase)}`}>
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
export const __testing__ = { WHISPER_TEXT, WHISPER_WRAP } as const;
