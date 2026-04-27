/**
 * RecognitionWhisper — ambient return-visit recognition.
 *
 * Renders the archetype whisper as an atmospheric element, not a modal/toast.
 * Hidden on first visit (stranger tier). Fades in via a CSS animation-delay
 * (the *visible* lift gate); after the canonical recognition silence dwells
 * out, the cue drops to muted. A breath. The blog saying "I remember you"
 * without saying it.
 *
 * Timing — the cue's full state machine (rest → lift → settle → hold → fold)
 * lives in `lib/return/recognition-timeline.ts` and is walked by
 * `useRecognitionPhase`. The resolver returns the `whisperTimeline()` plan
 * (`holdMs = MOTION.linger * 8`, `foldMs = MOTION.settle`) — the canonical
 * eight-`linger`-breath dwell shared with `ViaWhisper`. The local hand-rolled
 * `WHISPER_SETTLE_MS = MOTION.linger * 8` constant retired with this PR
 * (Mike napkin §"Surgical adoption").
 *
 * Design tokens: mist text, rose accent on archetype keyword, gold glow.
 */

'use client';

import type { ReturnRecognitionState } from '@/lib/hooks/useReturnRecognition';
import { MOTION } from '@/lib/design/motion';
import { gestureClassesOf } from '@/lib/design/gestures';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useRecognitionPhase } from '@/lib/hooks/useRecognitionPhase';
import { resolveRecognitionTimeline } from '@/lib/return/recognition-timeline';

interface Props {
  recognition: ReturnRecognitionState;
}

export function RecognitionWhisper({ recognition }: Props) {
  const reduce = useReducedMotion();
  const timeline = resolveRecognitionTimeline('whisper', { reducedMotion: reduce });
  const { phase } = useRecognitionPhase(timeline);
  const settled = phase === 'hold' || phase === 'fold';

  if (!recognition.isReturning || !recognition.lastWhisper) return null;

  const archetypeLabel = formatArchetype(recognition.archetype);

  return (
    <div
      // alpha-ledger:exempt — motion fade endpoint (animate-fade-in starts at opacity-0)
      className="animate-fade-in opacity-0"
      style={{ animationDelay: `${MOTION.settle}ms`, animationFillMode: 'forwards' }}
    >
      <p
        className={`text-sys-caption italic font-display transition-opacity ${gestureClassesOf('whisper-linger')} thermal-drift
          ${settled ? 'opacity-muted' : 'opacity-quiet'}`}
        style={{ color: 'var(--mist)' }}
      >
        <span className="text-gold/50">{archetypeLabel}</span>
        {' · '}
        {recognition.lastWhisper}
      </p>
    </div>
  );
}

function formatArchetype(key: string | null): string {
  if (!key) return '';
  return key.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}
