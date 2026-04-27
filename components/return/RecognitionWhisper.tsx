/**
 * RecognitionWhisper — ambient return-visit recognition.
 *
 * Renders the archetype whisper as an atmospheric element, not a modal/toast.
 * Hidden on first visit (stranger tier). The opening breath, the dwell, and
 * the retirement to muted are all phase-driven by the Recognition Timeline
 * kernel. A breath. The blog saying "I remember you" without saying it.
 *
 * Timing — the cue's full state machine (rest → lift → settle → hold → fold)
 * lives in `lib/return/recognition-timeline.ts` and is walked by
 * `useRecognitionPhase`. The resolver returns the `whisperTimeline()` plan
 * which now owns ALL FIVE durations including `liftMs` (the visible breath
 * before the cue speaks). Sister surface `ViaWhisper` inherits the same
 * timeline — both whispers paint as if they were one element seen twice
 * (Mike napkin §"Kernel-Owned Anticipation"; Tanya UX §1 "two doors, one
 * column").
 *
 * Phase → opacity rung mapping (the call-site policy):
 *   • `rest`           → opacity-0       (the breath; nothing visible)
 *   • `lift` / `settle`→ opacity-quiet   (the cue speaks at gold/70)
 *   • `hold` / `fold`  → opacity-muted   (the dim after the dwell)
 *
 * The fade between rungs is the existing `whisper-linger` gesture verb
 * (resolved via `gestureClassesOf` — see `lib/design/gestures.ts`).
 * Opacity only, no translate, no blur. Whispers speak; they do not arrive.
 *
 * Design tokens: mist text, gold/50 accent on archetype keyword.
 */

'use client';

import type { ReturnRecognitionState } from '@/lib/hooks/useReturnRecognition';
import { gestureClassesOf } from '@/lib/design/gestures';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useRecognitionPhase } from '@/lib/hooks/useRecognitionPhase';
import {
  resolveRecognitionTimeline,
  type RecognitionPhase,
} from '@/lib/return/recognition-timeline';

interface Props {
  recognition: ReturnRecognitionState;
}

export function RecognitionWhisper({ recognition }: Props) {
  const reduce = useReducedMotion();
  const timeline = resolveRecognitionTimeline('whisper', { reducedMotion: reduce });
  const { phase } = useRecognitionPhase(timeline);

  if (!recognition.isReturning || !recognition.lastWhisper) return null;

  const archetypeLabel = formatArchetype(recognition.archetype);

  return (
    <p
      // alpha-ledger:exempt — phase-driven opacity rungs (kernel-owned timing)
      className={`text-sys-caption italic font-display transition-opacity ${gestureClassesOf('whisper-linger')} thermal-drift ${phaseOpacityClass(phase)}`}
      style={{ color: 'var(--mist)' }}
    >
      <span className="text-gold/50">{archetypeLabel}</span>
      {' · '}
      {recognition.lastWhisper}
    </p>
  );
}

/**
 * Map a recognition phase to its alpha rung class. Pure, ≤ 10 LoC.
 *
 *   `rest`           → opacity-0       (the breath before the cue)
 *   `lift` / `settle`→ opacity-quiet   (the speaking)
 *   `hold` / `fold`  → opacity-muted   (the dwell-out)
 */
function phaseOpacityClass(phase: RecognitionPhase): string {
  if (phase === 'rest') return 'opacity-0';
  if (phase === 'hold' || phase === 'fold') return 'opacity-muted';
  return 'opacity-quiet';
}

function formatArchetype(key: string | null): string {
  if (!key) return '';
  return key.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}
