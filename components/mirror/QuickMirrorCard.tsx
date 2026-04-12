/**
 * QuickMirrorCard — inline archetype reveal after 30% scroll.
 *
 * Animation phases: hidden → emergence → shimmer → reveal → rest.
 * Two-phase reveal: text appears first, share actions fade in after delay.
 * No auto-scroll — reader finds the card naturally on their next scroll.
 */

'use client';

import { useState, useEffect } from 'react';
import type { QuickMirrorResult } from '@/lib/mirror/quick-synthesize';
import { ARCHETYPE_COLORS } from '@/lib/content/content-layers';
import type { ArchetypeKey } from '@/types/content';
import ShareOverlay from './ShareOverlay';

const T_EMERGE  = 0;
const T_SHIMMER = 400;
const T_REVEAL  = 1200;
const T_REST    = 2500;
const T_SHARES  = T_REST + 800;  // Share actions appear 800ms after rest

type Phase = 'hidden' | 'emergence' | 'shimmer' | 'reveal' | 'rest';

interface Props {
  result: QuickMirrorResult;
  articleId?: string;
}

export default function QuickMirrorCard({ result, articleId }: Props) {
  const [phase, setPhase]         = useState<Phase>('hidden');
  const [dismissed, setDismissed] = useState(false);
  const [showShares, setShowShares] = useState(false);

  useEffect(() => {
    const ids = [
      setTimeout(() => setPhase('emergence'), T_EMERGE),
      setTimeout(() => setPhase('shimmer'),   T_SHIMMER),
      setTimeout(() => setPhase('reveal'),    T_REVEAL),
      setTimeout(() => setPhase('rest'),      T_REST),
      setTimeout(() => setShowShares(true),   T_SHARES),
    ];
    return () => ids.forEach(clearTimeout);
  }, []);

  if (dismissed) return (
    <div className="my-12 mx-auto max-w-divider h-px bg-gold/20 rounded-full" />
  );

  const showContent = phase === 'reveal' || phase === 'rest';
  const colors = ARCHETYPE_COLORS[(result.archetype as ArchetypeKey) ?? 'collector'];

  return (
    <div className={`${cardBase()} ${phaseClass(phase, colors)}`}>
      <DismissBtn onDismiss={() => setDismissed(true)} />
      <RevealLabel visible={showContent} />
      <ArchetypeName
        label={result.archetypeLabel}
        visible={showContent}
        color={colors.hex}
      />
      <WhisperQuote text={result.whisper} visible={showContent} />
      <GoldDivider visible={showContent} color={colors.hex} />
      {showShares && (
        <ShareOverlay result={result} articleId={articleId} />
      )}
    </div>
  );
}

/* ─── Sub-components (each ≤ 10 lines) ──────────────────── */

function DismissBtn({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button onClick={onDismiss}
      className="absolute top-3 right-3 text-mist/30 hover:text-mist/60
        transition-colors duration-hover text-lg leading-none"
      aria-label="Dismiss">×</button>
  );
}

function RevealLabel({ visible }: { visible: boolean }) {
  return (
    <p className={fadeClass(visible)} style={fadeStyle(visible, 0)}>
      Because you stayed…
    </p>
  );
}

function ArchetypeName({ label, visible, color }: {
  label: string; visible: boolean; color: string;
}) {
  return (
    <h2 className={`mt-3 text-3xl font-display font-bold tracking-tight ${fadeClass(visible)}`}
      style={{ ...fadeStyle(visible, 150), color: visible ? color : undefined }}>
      {label}
    </h2>
  );
}

function WhisperQuote({ text, visible }: { text: string; visible: boolean }) {
  return (
    <p className={`mt-3 text-sm text-foreground/80 italic max-w-card-body
      mx-auto leading-relaxed ${fadeClass(visible)}`}
      style={fadeStyle(visible, 300)}>
      &ldquo;{text}&rdquo;
    </p>
  );
}

function GoldDivider({ visible, color }: { visible: boolean; color: string }) {
  return (
    <div className={`my-6 h-px max-w-divider mx-auto transition-transform duration-500
      ${visible ? 'scale-x-100' : 'scale-x-0'}`}
      style={{ backgroundColor: visible ? color : undefined, opacity: 0.4 }} />
  );
}

/* ─── Style helpers ──────────────────────────────────────── */

function cardBase(): string {
  return 'relative my-20 mx-auto max-w-card p-8 text-center'
    + ' rounded-xl border bg-gradient-to-b from-surface to-background'
    + ' transition-all duration-reveal ease-out';
}

function phaseClass(p: Phase, colors: { shimmerFrom: string; shimmerTo: string }): string {
  const map: Record<Phase, string> = {
    hidden:    'opacity-0 translate-y-enter-md border-transparent',
    emergence: 'opacity-80 translate-y-0 border-gold/10',
    shimmer:   `opacity-100 translate-y-0 border-gold/20 shadow-gold-intense`,
    reveal:    'opacity-100 translate-y-0 border-gold/20 shadow-gold',
    rest:      'opacity-100 translate-y-0 border-gold/20 shadow-gold',
  };
  return map[p];
}

function fadeClass(visible: boolean): string {
  const base = 'transition-all duration-500';
  return visible ? `${base} opacity-100 translate-y-0` : `${base} opacity-0 translate-y-enter-sm`;
}

function fadeStyle(visible: boolean, delayMs: number): React.CSSProperties {
  return visible ? { transitionDelay: `${delayMs}ms` } : {};
}
