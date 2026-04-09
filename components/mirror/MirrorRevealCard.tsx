/**
 * MirrorRevealCard — full archetype reveal on /mirror page.
 *
 * Animation phases: hidden → shimmer → reveal → done.
 * Stripped to archetype + whisper + share. No analytics dashboard.
 */
'use client';

import { useState, useEffect } from 'react';
import type { ReaderMirror } from '@/types/mirror';
import type { ArchetypeKey } from '@/types/content';
import ShareOverlay from './ShareOverlay';
import type { QuickMirrorResult } from '@/lib/mirror/quick-synthesize';

interface Props { mirror: ReaderMirror; }

type Phase = 'hidden' | 'shimmer' | 'reveal' | 'done';

export default function MirrorRevealCard({ mirror }: Props) {
  const [phase, setPhase] = useState<Phase>('hidden');

  useEffect(() => {
    setPhase('shimmer');
    const t1 = setTimeout(() => setPhase('reveal'), 800);
    const t2 = setTimeout(() => setPhase('done'), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const showContent = phase === 'reveal' || phase === 'done';
  const showActions = phase === 'done';

  const shareResult: QuickMirrorResult = {
    archetype: mirror.archetype as ArchetypeKey,
    archetypeLabel: mirror.archetypeLabel,
    whisper: mirror.whisper,
    confidence: 80,
    scores: mirror.scores,
  };

  return (
    <div className="flex justify-center">
      <div className={`
        mirror-card relative w-80 rounded-2xl p-8 text-center overflow-hidden
        bg-gradient-to-b from-surface to-background
        border border-primary/30
        transition-all duration-700
        ${phase === 'hidden' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        ${phase === 'shimmer' ? 'mirror-shimmer' : ''}
        ${showContent ? 'shadow-gold border-[rgba(240,198,116,0.2)]' : ''}
      `}>
        <p className={`text-xs uppercase tracking-widest text-gold/60 mb-2
          transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: phase === 'reveal' ? '0ms' : undefined }}>
          Based on how you read…
        </p>

        <h2 className={`text-2xl font-display font-bold text-gold
          transition-all duration-500
          ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: phase === 'reveal' ? '150ms' : undefined }}>
          {mirror.archetypeLabel}
        </h2>

        <p className={`text-sm text-white/80 italic mb-6 transition-all duration-500
          ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: phase === 'reveal' ? '300ms' : undefined }}>
          &ldquo;{mirror.whisper}&rdquo;
        </p>

        <div className={`my-4 h-px max-w-[200px] mx-auto bg-gold/40
          transition-transform duration-500
          ${showContent ? 'scale-x-100' : 'scale-x-0'}`} />

        {showActions && <ShareOverlay result={shareResult} />}
      </div>
    </div>
  );
}
