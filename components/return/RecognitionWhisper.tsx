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
 * timeline AND the same paint policy — two surfaces converge here; a third
 * joins when it earns it. (Mike napkin §"Kernel-Owned Anticipation"; #115
 * §"Whisper Opacity Convergence"; Tanya UX #79 §1 "two doors, one column".)
 *
 * Phase → opacity rung mapping is owned by `lib/return/recognition-paint.ts`
 * (sibling to the timing kernel). The fade between rungs is the existing
 * `whisper-linger` gesture verb (resolved via `gestureClassesOf` — see
 * `lib/design/gestures.ts`). Opacity only, no translate, no blur. Whispers
 * speak; they do not arrive.
 *
 * Design tokens: mist text, gold/50 accent on archetype keyword.
 */

'use client';

import type { ReturnRecognitionState } from '@/lib/hooks/useReturnRecognition';
import { gestureClassesOf } from '@/lib/design/gestures';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useRecognitionPhase } from '@/lib/hooks/useRecognitionPhase';
import { useThermal } from '@/components/thermal/ThermalProvider';
import { resolveRecognitionTimeline } from '@/lib/return/recognition-timeline';
import { phaseOpacityClass } from '@/lib/return/recognition-paint';

interface Props {
  recognition: ReturnRecognitionState;
}

export function RecognitionWhisper({ recognition }: Props) {
  const reduce = useReducedMotion();
  // Recognition Cadence (Mike napkin §"Module shape", Tanya UIX §1.1):
  // thread `state` into the resolver so warm/luminous returners get a
  // slightly longer approach. Reduced-motion still floors the plan;
  // cold readers receive identity tempo. The dwell stays sacred.
  const { state: thermalState } = useThermal();
  const timeline = resolveRecognitionTimeline('whisper', {
    reducedMotion: reduce, thermal: thermalState,
  });
  const { phase } = useRecognitionPhase(timeline);

  if (!recognition.isReturning || !recognition.lastWhisper) return null;

  const archetypeLabel = formatArchetype(recognition.archetype);

  return (
    <p
      className={`text-sys-caption italic font-display transition-opacity ${gestureClassesOf('whisper-linger')} thermal-drift ${phaseOpacityClass(phase)}`}
      style={{ color: 'var(--mist)' }}
    >
      <span className="text-gold/50">{archetypeLabel}</span>
      {' · '}
      {recognition.lastWhisper}
    </p>
  );
}

function formatArchetype(key: string | null): string {
  if (!key) return '';
  return key.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}
