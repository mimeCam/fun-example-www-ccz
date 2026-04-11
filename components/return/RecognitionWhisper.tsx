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

interface Props {
  recognition: ReturnRecognitionState;
}

export function RecognitionWhisper({ recognition }: Props) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!recognition.isReturning) return;
    const id = setTimeout(() => setSettled(true), 8000);
    return () => clearTimeout(id);
  }, [recognition.isReturning]);

  if (!recognition.isReturning || !recognition.lastWhisper) return null;

  const archetypeLabel = formatArchetype(recognition.archetype);

  return (
    <div
      className="animate-fade-in opacity-0"
      style={{ animationDelay: '1.5s', animationFillMode: 'forwards' }}
    >
      <p
        className={`text-sm italic font-display transition-opacity duration-linger thermal-drift
          ${settled ? 'opacity-30' : 'opacity-70'}`}
        style={{ color: 'var(--mist)' }}
      >
        <span className="text-gold/60">{archetypeLabel}</span>
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
