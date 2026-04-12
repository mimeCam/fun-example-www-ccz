/**
 * MirrorRevealCard — full archetype reveal on /mirror page.
 *
 * Animation phases: hidden → emergence → shimmer → reveal → done.
 * Archetype-specific color identity: each archetype gets its own color.
 * Share actions appear with staggered delays (0/100/200ms).
 */

'use client';

import { useState, useEffect } from 'react';
import type { ReaderMirror } from '@/types/mirror';
import type { ArchetypeKey } from '@/types/content';
import type { QuickMirrorResult } from '@/lib/mirror/quick-synthesize';
import { ARCHETYPE_COLORS } from '@/lib/content/content-layers';
import ShareOverlay from './ShareOverlay';

const T_EMERGE  = 0;
const T_SHIMMER = 400;
const T_REVEAL  = 1200;
const T_REST    = 2500;

type Phase = 'hidden' | 'emergence' | 'shimmer' | 'reveal' | 'done';

interface Props {
  mirror: ReaderMirror;
  articleId?: string;
}

export default function MirrorRevealCard({ mirror, articleId }: Props) {
  const [phase, setPhase] = useState<Phase>('hidden');

  useEffect(() => {
    const ids = [
      setTimeout(() => setPhase('emergence'), T_EMERGE),
      setTimeout(() => setPhase('shimmer'),   T_SHIMMER),
      setTimeout(() => setPhase('reveal'),    T_REVEAL),
      setTimeout(() => setPhase('done'),      T_REST),
    ];
    return () => ids.forEach(clearTimeout);
  }, []);

  const showContent = phase === 'reveal' || phase === 'done';
  const showActions = phase === 'done';

  const colors = ARCHETYPE_COLORS[(mirror.archetype as ArchetypeKey) ?? 'collector'];

  const shareResult: QuickMirrorResult = {
    archetype: mirror.archetype as ArchetypeKey,
    archetypeLabel: mirror.archetypeLabel,
    whisper: mirror.whisper,
    confidence: mirror.scores
      ? Math.round(Object.values(mirror.scores).reduce((a: number, b: unknown) => a + (b as number), 0) / Object.values(mirror.scores).length)
      : 80,
    scores: mirror.scores,
  };

  return (
    <div className="flex justify-center">
      <div className={`
        relative max-w-md w-full thermal-radius-wide p-8 text-center
        bg-gradient-to-b from-surface to-background overflow-hidden
        transition-all duration-reveal ease-out
        ${phaseStyle(phase)}
      `}
        style={shimmerStyle(phase, colors)}>
        <p className={`text-xs uppercase tracking-widest mb-2
          transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-enter-md'}`}
          style={{ transitionDelay: phase === 'reveal' ? '0ms' : undefined, color: colors.hex, opacity: showContent ? 0.7 : 0 }}>
          Because you stayed…
        </p>

        <h2 className={`text-3xl font-display font-bold tracking-tight
          transition-all duration-500
          ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-enter-md'}`}
          style={{ transitionDelay: phase === 'reveal' ? '150ms' : undefined, color: colors.hex }}>
          {mirror.archetypeLabel}
        </h2>

        <p className={`mt-3 text-sm text-foreground/80 italic max-w-card-body
          mx-auto leading-relaxed transition-all duration-500
          ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-enter-md'}`}
          style={{ transitionDelay: phase === 'reveal' ? '300ms' : undefined }}>
          &ldquo;{mirror.whisper}&rdquo;
        </p>

        <div className={`my-6 h-px max-w-divider mx-auto transition-transform duration-500
          ${showContent ? 'scale-x-100' : 'scale-x-0'}`}
          style={{ backgroundColor: colors.hex, opacity: 0.4 }} />

        {showActions && <ShareOverlay result={shareResult} articleId={articleId} />}
      </div>
    </div>
  );
}

/* ─── Style helpers ──────────────────────────────────────── */

function phaseStyle(p: Phase): string {
  const map: Record<Phase, string> = {
    hidden:    'opacity-0 translate-y-enter-md border-transparent',
    emergence: 'opacity-80 translate-y-0 border-gold/10',
    shimmer:   'opacity-100 translate-y-0 border-gold/20',
    reveal:    'opacity-100 translate-y-0 border-gold/20 shadow-gold',
    done:      'opacity-100 translate-y-0 border-gold/20 shadow-gold',
  };
  return map[p];
}

/** Applies archetype-colored shimmer box-shadow during the shimmer phase. */
function shimmerStyle(p: Phase, colors: { shimmerFrom: string; shimmerTo: string }): React.CSSProperties {
  if (p !== 'shimmer') return {};
  return { boxShadow: `0 12px 60px ${colors.shimmerTo}` };
}
