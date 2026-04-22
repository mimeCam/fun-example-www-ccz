/**
 * QuickMirrorCard — inline archetype reveal, placed at end-of-article.
 *
 * Animation phases: hidden → emergence → shimmer → reveal → rest.
 * Uses useMirrorPhases for state machine, useMirrorPhases for timing.
 * Archetype-specific: each archetype has its own shimmer color and personality.
 */

'use client';

import { useState } from 'react';
import type { QuickMirrorResult } from '@/lib/mirror/quick-synthesize';
import { ARCHETYPE_COLORS } from '@/lib/content/content-layers';
import type { ArchetypeKey } from '@/types/content';
import { useMirrorPhases, QUICK_TIMINGS, type Phase } from '@/lib/hooks/useMirrorPhases';
import ShareOverlay from './ShareOverlay';
import { Pressable } from '@/components/shared/Pressable';

interface Props {
  result: QuickMirrorResult;
  articleId?: string;
}

export default function QuickMirrorCard({ result, articleId }: Props) {
  const { phase, showContent, showShares } = useMirrorPhases(QUICK_TIMINGS);
  const [dismissed, setDismissed] = useState(false);
  const colors = ARCHETYPE_COLORS[(result.archetype as ArchetypeKey) ?? 'collector'];

  if (dismissed) return (
    <div className="my-sys-8 mx-auto max-w-divider h-px bg-gold/20 rounded-full" />
  );

  return (
    <div className={`${cardBase()} ${phaseClass(phase)}`}
      style={shimmerStyle(phase, colors)}>
      <DismissBtn onDismiss={() => setDismissed(true)} />
      <RevealLabel visible={showContent} color={colors.hex} />
      <ArchetypeName label={result.archetypeLabel} visible={showContent} color={colors.hex} />
      <WhisperQuote text={result.whisper} visible={showContent} />
      <GoldDivider visible={showContent} color={colors.hex} />
      {showShares && <ShareOverlay result={result} articleId={articleId} />}
    </div>
  );
}

/* ─── Sub-components (each ≤ 10 lines) ──────────────────── */

function DismissBtn({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Pressable
      variant="icon"
      size="sm"
      onClick={onDismiss}
      aria-label="Dismiss"
      className="absolute top-sys-3 right-sys-3 text-sys-lg leading-none"
    >
      ×
    </Pressable>
  );
}

function RevealLabel({ visible, color }: { visible: boolean; color: string }) {
  return (
    <p className={fadeClass(visible)} style={{ ...fadeStyle(visible, 0), color }}>
      Because you stayed…
    </p>
  );
}

function ArchetypeName({ label, visible, color }: {
  label: string; visible: boolean; color: string;
}) {
  return (
    <h2 className={`mt-sys-3 text-sys-h2 font-display font-sys-display tracking-tight
      ${visible ? 'mirror-archetype-label' : fadeClass(false)}`}
      style={{ ...fadeStyle(visible, 150), color: visible ? color : undefined }}>
      {label}
    </h2>
  );
}

function WhisperQuote({ text, visible }: { text: string; visible: boolean }) {
  return (
    <p className={`mt-sys-3 text-sys-caption text-foreground/80 italic max-w-card-body
      mx-auto leading-relaxed ${fadeClass(visible)}`}
      style={fadeStyle(visible, 300)}>
      &ldquo;{text}&rdquo;
    </p>
  );
}

function GoldDivider({ visible, color }: { visible: boolean; color: string }) {
  return (
    <div className={`my-sys-7 h-px max-w-divider mx-auto transition-transform duration-fade
      ${visible ? 'scale-x-100' : 'scale-x-0'}`}
      style={{ backgroundColor: visible ? color : undefined, opacity: 0.4 }} />
  );
}

/* ─── Style helpers ──────────────────────────────────────── */

function cardBase(): string {
  return 'relative my-sys-10 mx-auto max-w-card p-sys-7 text-center'
    + ' thermal-radius-wide border bg-gradient-to-b from-surface to-background'
    + ' transition-all duration-reveal ease-out';
}

function phaseClass(p: Phase): string {
  const map: Record<Phase, string> = {
    hidden:    'opacity-0 translate-y-enter-md border-transparent',
    emergence: 'opacity-80 translate-y-0 border-gold/10',
    shimmer:   'opacity-100 translate-y-0 border-gold/20 mirror-card-shimmer',
    reveal:    'opacity-100 translate-y-0 border-gold/20 shadow-gold',
    rest:      'opacity-100 translate-y-0 border-gold/20 shadow-gold',
  };
  return map[p];
}

/** Archetype-colored box-shadow during shimmer — each archetype glows its own color. */
function shimmerStyle(p: Phase, colors: { shimmerTo: string }): React.CSSProperties {
  if (p !== 'shimmer') return {};
  return { boxShadow: `0 12px 60px ${colors.shimmerTo}` };
}

function fadeClass(visible: boolean): string {
  const base = 'transition-all duration-fade';
  return visible ? `${base} opacity-100 translate-y-0` : `${base} opacity-0 translate-y-enter-sm`;
}

function fadeStyle(visible: boolean, delayMs: number): React.CSSProperties {
  return visible ? { transitionDelay: `${delayMs}ms` } : {};
}
