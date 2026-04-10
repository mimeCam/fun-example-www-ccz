/**
 * QuickMirrorCard — inline archetype reveal after 30% scroll.
 *
 * Animation phases: hidden → emergence → shimmer → reveal → rest.
 * Total animation: ~2.5s (compressed from 3.5s per UX spec).
 * ShareOverlay appears at rest phase — the viral loop starts here.
 * Smooth-scrolls into view so the reader's current paragraph stays in place.
 */
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import type { QuickMirrorResult } from '@/lib/mirror/quick-synthesize';
import ShareOverlay from './ShareOverlay';

const T_EMERGE  = 0;
const T_SHIMMER = 400;
const T_REVEAL  = 1200;
const T_REST    = 2500;

type Phase = 'hidden' | 'emergence' | 'shimmer' | 'reveal' | 'rest';

interface Props {
  result: QuickMirrorResult;
  articleId?: string;
}

export default function QuickMirrorCard({ result, articleId }: Props) {
  const [phase, setPhase]     = useState<Phase>('hidden');
  const [dismissed, setDismissed] = useState(false);
  const cardRef               = useRef<HTMLDivElement>(null);

  // Smooth-scroll the card into view so the reader doesn't lose their place.
  // Offset by -25vh so the card appears near the bottom of the viewport,
  // keeping the reader's current paragraph visible above it.
  const scrollIntoView = useCallback(() => {
    if (!cardRef.current) return;
    const offset = window.innerHeight * 0.25;
    const top = cardRef.current.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollIntoView();
    const ids = [
      setTimeout(() => setPhase('emergence'), T_EMERGE),
      setTimeout(() => setPhase('shimmer'),   T_SHIMMER),
      setTimeout(() => setPhase('reveal'),    T_REVEAL),
      setTimeout(() => setPhase('rest'),      T_REST),
    ];
    return () => ids.forEach(clearTimeout);
  }, [scrollIntoView]);

  if (dismissed) return (
    <div className="my-12 mx-auto max-w-[200px] h-px bg-gold/30 rounded-full" />
  );

  const showContent = phase === 'reveal' || phase === 'rest';
  const showActions = phase === 'rest';

  return (
    <div ref={cardRef} className={`${cardBase()} ${phaseClass(phase)}`}>
      <DismissBtn onDismiss={() => setDismissed(true)} />
      <RevealLabel visible={showContent} />
      <ArchetypeName label={result.archetypeLabel} visible={showContent} />
      <WhisperQuote text={result.whisper} visible={showContent} />
      <GoldDivider visible={showContent} />
      {showActions && (
        <ShareOverlay result={result} articleId={articleId} />
      )}
    </div>
  );
}

function DismissBtn({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button onClick={onDismiss}
      className="absolute top-3 right-3 text-mist/40 hover:text-white/80
        transition-colors duration-200 text-lg leading-none"
      aria-label="Dismiss">×</button>
  );
}

function RevealLabel({ visible }: { visible: boolean }) {
  return (
    <p className={fadeClass(visible)}
      style={fadeStyle(visible, 0)}>
      Based on how you read…
    </p>
  );
}

function ArchetypeName({ label, visible }: { label: string; visible: boolean }) {
  return (
    <h2 className={`mt-3 text-3xl font-display font-bold text-gold ${fadeClass(visible)}`}
      style={fadeStyle(visible, 150)}>
      {label}
    </h2>
  );
}

function WhisperQuote({ text, visible }: { text: string; visible: boolean }) {
  return (
    <p className={`mt-3 text-sm text-white/80 italic max-w-[340px]
      mx-auto leading-relaxed ${fadeClass(visible)}`}
      style={fadeStyle(visible, 300)}>
      &ldquo;{text}&rdquo;
    </p>
  );
}

function GoldDivider({ visible }: { visible: boolean }) {
  return (
    <div className={`my-6 h-px max-w-[200px] mx-auto bg-gold/40
      transition-transform duration-500 ${visible ? 'scale-x-100' : 'scale-x-0'}`} />
  );
}

function cardBase(): string {
  return 'relative my-20 mx-auto max-w-[400px] p-8 text-center'
    + ' rounded-2xl border bg-gradient-to-b from-surface to-background'
    + ' transition-all duration-700 ease-out';
}

function phaseClass(p: Phase): string {
  const map: Record<Phase, string> = {
    hidden:    'opacity-0 translate-y-4 border-transparent',
    emergence: 'opacity-100 translate-y-0 border-gold/15',
    shimmer:   'opacity-100 translate-y-0 border-gold/25 shadow-gold-intense animate-quick-mirror-glow',
    reveal:    'opacity-100 translate-y-0 border-gold/25 shadow-gold',
    rest:      'opacity-100 translate-y-0 border-gold/20 shadow-gold',
  };
  return map[p];
}

function fadeClass(visible: boolean): string {
  const base = 'transition-all duration-500';
  return visible ? `${base} opacity-100 translate-y-0` : `${base} opacity-0 translate-y-2`;
}

function fadeStyle(visible: boolean, delayMs: number): React.CSSProperties {
  return visible ? { transitionDelay: `${delayMs}ms` } : {};
}
