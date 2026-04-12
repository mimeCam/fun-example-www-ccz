/**
 * MirrorRevealCard — full archetype reveal on /mirror page.
 *
 * Same phase system as QuickMirrorCard but faster ceremony (~3.5s vs ~5.2s).
 * The reader chose to come here — less preamble, faster reward.
 * Share actions appear 600ms after rest (vs 1200ms inline).
 */

'use client';

import type { ReaderMirror } from '@/types/mirror';
import type { ArchetypeKey } from '@/types/content';
import type { QuickMirrorResult } from '@/lib/mirror/quick-synthesize';
import { ARCHETYPE_COLORS } from '@/lib/content/content-layers';
import { useMirrorPhases, MIRROR_PAGE_TIMINGS, type Phase } from '@/lib/hooks/useMirrorPhases';
import ShareOverlay from './ShareOverlay';

interface Props {
  mirror: ReaderMirror;
  articleId?: string;
}

export default function MirrorRevealCard({ mirror, articleId }: Props) {
  const { phase, showContent, showShares } = useMirrorPhases(MIRROR_PAGE_TIMINGS);
  const colors = ARCHETYPE_COLORS[(mirror.archetype as ArchetypeKey) ?? 'collector'];
  const shareResult = buildShareResult(mirror);

  return (
    <div className="flex justify-center">
      <div className={`
        relative max-w-md w-full thermal-radius-wide p-8 text-center
        bg-gradient-to-b from-surface to-background overflow-hidden
        transition-all duration-reveal ease-out
        ${phaseClass(phase)}
      `}
        style={shimmerStyle(phase, colors)}>
        <RevealLabel visible={showContent} color={colors.hex} />
        <ArchetypeName label={mirror.archetypeLabel} visible={showContent} color={colors.hex} />
        <WhisperQuote text={mirror.whisper} visible={showContent} />
        <GoldDivider visible={showContent} color={colors.hex} />
        {showShares && <ShareOverlay result={shareResult} articleId={articleId} />}
      </div>
    </div>
  );
}

/* ─── Sub-components (each ≤ 10 lines) ──────────────────── */

function RevealLabel({ visible, color }: { visible: boolean; color: string }) {
  return (
    <p className={`text-xs uppercase tracking-widest mb-2
      transition-all duration-fade ${fadeClass(visible)}`}
      style={{ ...fadeStyle(visible, 0), color, opacity: visible ? 0.7 : 0 }}>
      Because you stayed…
    </p>
  );
}

function ArchetypeName({ label, visible, color }: {
  label: string; visible: boolean; color: string;
}) {
  return (
    <h2 className={`text-3xl font-display font-bold tracking-tight
      ${visible ? 'mirror-archetype-label' : fadeClass(false)}`}
      style={{ ...fadeStyle(visible, 150), color }}>
      {label}
    </h2>
  );
}

function WhisperQuote({ text, visible }: { text: string; visible: boolean }) {
  return (
    <p className={`mt-3 text-sm text-foreground/80 italic max-w-card-body
      mx-auto leading-relaxed transition-all duration-fade ${fadeClass(visible)}`}
      style={fadeStyle(visible, 300)}>
      &ldquo;{text}&rdquo;
    </p>
  );
}

function GoldDivider({ visible, color }: { visible: boolean; color: string }) {
  return (
    <div className={`my-6 h-px max-w-divider mx-auto transition-transform duration-fade
      ${visible ? 'scale-x-100' : 'scale-x-0'}`}
      style={{ backgroundColor: color, opacity: 0.4 }} />
  );
}

/* ─── Helpers ───────────────────────────────────────────── */

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

function shimmerStyle(p: Phase, colors: { shimmerTo: string }): React.CSSProperties {
  if (p !== 'shimmer') return {};
  return { boxShadow: `0 12px 60px ${colors.shimmerTo}` };
}

function fadeClass(visible: boolean): string {
  return visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-enter-md';
}

function fadeStyle(visible: boolean, delayMs: number): React.CSSProperties {
  return visible ? { transitionDelay: `${delayMs}ms` } : {};
}

function buildShareResult(mirror: ReaderMirror): QuickMirrorResult {
  return {
    archetype: mirror.archetype as ArchetypeKey,
    archetypeLabel: mirror.archetypeLabel,
    whisper: mirror.whisper,
    confidence: mirror.scores
      ? Math.round(
          Object.values(mirror.scores).reduce(
            (a: number, b: unknown) => a + (b as number), 0
          ) / Object.values(mirror.scores).length
        )
      : 80,
    scores: mirror.scores,
  };
}
