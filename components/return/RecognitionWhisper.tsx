/**
 * RecognitionWhisper — ambient return-visit recognition.
 *
 * Renders the archetype whisper as an atmospheric element, not a modal/toast.
 * Hidden on first visit (stranger tier). Fades in, settles to 30% opacity.
 * A breath. The blog saying "I remember you" without saying it.
 *
 * Design tokens: mist text, rose accent on archetype keyword, gold glow.
 */

'use client';

import { useEffect, useState } from 'react';
import type { ReturnRecognitionState } from '@/lib/hooks/useReturnRecognition';
import { MOTION } from '@/lib/design/motion';

/** Whisper-settle dwell: eight `linger` breaths. A long, ambient quiet. */
const WHISPER_SETTLE_MS = MOTION.linger * 8; // 8000ms

interface Props {
  recognition: ReturnRecognitionState;
}

export function RecognitionWhisper({ recognition }: Props) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!recognition.isReturning) return;
    const id = setTimeout(() => setSettled(true), WHISPER_SETTLE_MS);
    return () => clearTimeout(id);
  }, [recognition.isReturning]);

  if (!recognition.isReturning || !recognition.lastWhisper) return null;

  const archetypeLabel = formatArchetype(recognition.archetype);

  return (
    <div
      // alpha-ledger:exempt — motion fade endpoint (animate-fade-in starts at opacity-0)
      className="animate-fade-in opacity-0"
      style={{ animationDelay: `${MOTION.settle}ms`, animationFillMode: 'forwards' }}
    >
      <p
        className={`text-sys-caption italic font-display transition-opacity duration-linger thermal-drift
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
