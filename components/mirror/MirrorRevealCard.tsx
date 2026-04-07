/**
 * MirrorRevealCard — full archetype reveal on /mirror page.
 *
 * Animation phases: hidden → shimmer → reveal → done.
 * Total animation: ~2.5s (compressed from 4.8s).
 * Chromatic aberration removed — replaced with warm gold glow.
 */
'use client';

import { useState, useEffect } from 'react';
import type { ReaderMirror } from '@/types/mirror';
import MirrorExportButton from './MirrorExportButton';

interface Props { mirror: ReaderMirror; }

type Phase = 'hidden' | 'shimmer' | 'reveal' | 'done';

export default function MirrorRevealCard({ mirror }: Props) {
  const [phase, setPhase] = useState<Phase>('hidden');

  // Compressed animation: hidden → shimmer → reveal → done
  useEffect(() => {
    setPhase('shimmer');
    const t1 = setTimeout(() => setPhase('reveal'), 800);
    const t2 = setTimeout(() => setPhase('done'), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const showContent = phase === 'reveal' || phase === 'done';
  const showTags = phase === 'done';

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
        {/* Label */}
        <p
          className={`text-xs uppercase tracking-widest text-gold/60 mb-2
            transition-all duration-500
            ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: phase === 'reveal' ? '0ms' : undefined }}
        >
          Based on how you read…
        </p>

        {/* Archetype name — gold, no chromatic aberration */}
        <h2 className={`text-2xl font-display font-bold text-gold
          transition-all duration-500
          ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: phase === 'reveal' ? '150ms' : undefined }}
        >
          {mirror.archetypeLabel}
        </h2>

        {/* Whisper quote */}
        <p className={`text-sm text-white/80 italic mb-6 transition-all duration-500
          ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: phase === 'reveal' ? '300ms' : undefined }}
        >
          &ldquo;{mirror.whisper}&rdquo;
        </p>

        {/* Score bars */}
        <div className={`space-y-3 mb-6 transition-all duration-500
          ${showContent ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: phase === 'reveal' ? '450ms' : undefined }}
        >
          {Object.entries(mirror.scores).map(([key, val]) => (
            <div key={key}>
              <div className="flex justify-between text-xs text-mist mb-1">
                <span className="capitalize">{key}</span><span>{val}</span>
              </div>
              <div className="h-1.5 bg-fog/30 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-gold/80 to-gold
                  transition-all duration-1000"
                  style={{ width: showContent ? `${val}%` : '0%' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Topic DNA tags */}
        <div className={`flex flex-wrap justify-center gap-2 transition-all duration-500
          ${showTags ? 'opacity-100' : 'opacity-0'}`}>
          {mirror.topicDNA.slice(0, 5).map(t => (
            <span key={t.topic}
              className="text-xs px-2 py-1 bg-primary/20 text-accent rounded-full">
              {t.topic} {t.weight}%
            </span>
          ))}
        </div>

        {/* Resonance themes */}
        {mirror.resonanceThemes.length > 0 && (
          <div className={`mt-5 transition-all duration-500
            ${showTags ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-[10px] text-mist uppercase tracking-widest mb-2">
              What moves you
            </p>
            <p className="text-sm text-white/80 leading-relaxed">
              {mirror.resonanceThemes.join(' · ')}
            </p>
          </div>
        )}

        {/* Export — visible as soon as content reveals */}
        {showContent && <MirrorExportButton mirror={mirror} />}
      </div>
    </div>
  );
}
