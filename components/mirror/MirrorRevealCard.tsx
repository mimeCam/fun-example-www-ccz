'use client';

import { useState, useEffect } from 'react';
import type { ReaderMirror } from '@/types/mirror';

interface Props { mirror: ReaderMirror; }

type Phase = 'hidden' | 'shimmer' | 'chromatic' | 'reveal' | 'done';

export default function MirrorRevealCard({ mirror }: Props) {
  const [phase, setPhase] = useState<Phase>('hidden');

  useEffect(() => {
    setPhase('shimmer');
    const t1 = setTimeout(() => setPhase('chromatic'), 800);
    const t2 = setTimeout(() => setPhase('reveal'), 2800);
    const t3 = setTimeout(() => setPhase('done'), 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const showContent = phase === 'reveal' || phase === 'done';
  const isChromatic = phase === 'chromatic';
  const showTags = phase === 'done';

  return (
    <div className="flex justify-center">
      <div className={`
        mirror-card relative w-80 rounded-3xl p-8 text-center overflow-hidden
        bg-gradient-to-b from-surface to-background
        border ${isChromatic ? 'border-accent shadow-2xl shadow-accent/40' : 'border-primary/30'}
        transition-all duration-700
        ${phase === 'hidden' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        ${phase === 'shimmer' ? 'mirror-shimmer' : ''}
        ${isChromatic ? 'mirror-chromatic' : ''}
      `}>
        <h2 className={`text-2xl font-display font-bold text-accent mb-2
          transition-all duration-700
          ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {mirror.archetypeLabel}
        </h2>

        <p className={`text-sm text-gray-300 italic mb-6 transition-all duration-700 delay-300
          ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          &ldquo;{mirror.whisper}&rdquo;
        </p>

        <div className={`space-y-3 mb-6 transition-all duration-700 delay-500
          ${showContent ? 'opacity-100' : 'opacity-0'}`}>
          {Object.entries(mirror.scores).map(([key, val]) => (
            <div key={key}>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span className="capitalize">{key}</span><span>{val}</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
                  style={{ width: showContent ? `${val}%` : '0%' }} />
              </div>
            </div>
          ))}
        </div>

        <div className={`flex flex-wrap justify-center gap-2 transition-all duration-500
          ${showTags ? 'opacity-100' : 'opacity-0'}`}>
          {mirror.topicDNA.slice(0, 5).map(t => (
            <span key={t.topic}
              className="text-xs px-2 py-1 bg-primary/20 text-accent rounded-full">
              {t.topic} {t.weight}%
            </span>
          ))}
        </div>

        {/* TODO: Add share/export button for PNG card download via html2canvas */}
        {/* TODO: Add resonance themes display */}
      </div>
    </div>
  );
}
