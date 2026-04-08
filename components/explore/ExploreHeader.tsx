'use client';

import { RecognitionTier } from '@/lib/hooks/useReturnRecognition';

interface ExploreHeaderProps {
  tier: RecognitionTier;
  archetype: string | null;
  whisper: string | null;
}

const ARCHETYPE_LABELS: Record<string, string> = {
  'deep-diver': 'Deep Diver',
  explorer: 'Explorer',
  faithful: 'Faithful',
  resonator: 'Resonator',
  collector: 'Collector',
};

export default function ExploreHeader({
  tier,
  archetype,
  whisper,
}: ExploreHeaderProps) {
  const isKnown = tier !== 'stranger' && archetype;
  const label = archetype ? ARCHETYPE_LABELS[archetype] : null;

  return (
    <header className="mb-10">
      <h1 className="font-display text-foreground text-3xl md:text-4xl font-bold mb-3">
        {isKnown ? 'Continue exploring' : 'What draws you?'}
      </h1>

      {isKnown && (
        <p className="text-gold/80 text-sm italic">
          {whisper ?? `Welcome back, ${label}.`}
        </p>
      )}

      {!isKnown && (
        <p className="text-mist text-sm">
          Articles, questions, and trails to wander through.
        </p>
      )}
    </header>
  );
}
