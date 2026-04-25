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
import { MOTION } from '@/lib/design/motion';
import { alphaClassOf } from '@/lib/design/alpha';

/* ─── Alpha-ledger handles (JIT-safe literals via alphaClassOf) ──────────
   Pinned at module scope so the `phaseClass` map below stays a plain
   Record<Phase,string> and Tailwind's JIT sees every literal in source.
   Mike napkin #19 §4.2 — pair-rule: all four phases share one rung family. */
const BORDER_HAIRLINE = alphaClassOf('gold', 'hairline', 'border'); // border-gold/10
const BORDER_MUTED    = alphaClassOf('gold', 'muted',    'border'); // border-gold/30
const WHISPER_TEXT    = alphaClassOf('foreground', 'quiet', 'text'); // text-foreground/70

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
        relative max-w-md w-full thermal-radius-wide p-sys-8 text-center
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
    <p className={`text-sys-micro uppercase tracking-sys-caption mb-sys-2
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
    <h2 className={`text-sys-h3 font-display font-sys-display tracking-sys-heading
      ${visible ? 'mirror-archetype-label' : fadeClass(false)}`}
      style={{ ...fadeStyle(visible, MOTION.instant), color }}>
      {label}
    </h2>
  );
}

function WhisperQuote({ text, visible }: { text: string; visible: boolean }) {
  // Alpha ledger: `quiet` (0.70) — "content, but not THE content."
  // The whisper is a quote; archetype name above is THE content. /80 was drift.
  return (
    <p className={`mt-sys-3 text-sys-caption ${WHISPER_TEXT} italic max-w-card-body
      mx-auto typo-caption transition-all duration-fade ${fadeClass(visible)}`}
      style={fadeStyle(visible, MOTION.enter)}>
      &ldquo;{text}&rdquo;
    </p>
  );
}

function GoldDivider({ visible, color }: { visible: boolean; color: string }) {
  // Alpha ledger: `muted` (0.30) — "ambient chrome; skip past it."
  // Same rung as the QuickMirrorCard divider and the GoldenThread fading posture.
  return (
    <div className={`my-sys-6 h-px max-w-divider mx-auto transition-transform duration-fade opacity-muted
      ${visible ? 'scale-x-100' : 'scale-x-0'}`}
      style={{ backgroundColor: color }} />
  );
}

/* ─── Helpers ───────────────────────────────────────────── */

function phaseClass(p: Phase): string {
  // Tanya §2.3: same as QuickMirrorCard — the room is warming (bloom),
  // not lifting. The reveal gesture lives in the prior shimmer phase.
  // alpha-ledger:exempt — motion fade endpoints (hidden → shimmer/reveal/rest).
  // `emergence` uses `opacity-quiet` (0.70) — the "content-but-not-the-content"
  // rung — so the card is legible at that tier before shimmer brings full presence.
  // Borders: hairline (0.10) on emergence, muted (0.30) on shimmer/reveal/rest —
  // pair-rule (Mike napkin #19): every "earned-attention" phase shares ONE rung.
  // Drift /20 was a tie-break to `muted`, not `hairline`, because shimmer/reveal
  // are attention-EARNING states, not chrome (Mike §4.2).
  const map: Record<Phase, string> = {
    hidden:    'opacity-0 translate-y-enter-md border-transparent',
    emergence: `opacity-quiet translate-y-0 ${BORDER_HAIRLINE}`,
    shimmer:   `opacity-100 translate-y-0 ${BORDER_MUTED} mirror-card-shimmer`,
    reveal:    `opacity-100 translate-y-0 ${BORDER_MUTED} shadow-sys-bloom`,
    rest:      `opacity-100 translate-y-0 ${BORDER_MUTED} shadow-sys-bloom`,
  };
  return map[p];
}

/* elevation-ledger:exempt — Tanya §5 mirror-card archetype-tint carve-out.
   Shape mirrors `bloom`; color is archetype-driven instead of gold. */
function shimmerStyle(p: Phase, colors: { shimmerTo: string }): React.CSSProperties {
  if (p !== 'shimmer') return {};
  return { boxShadow: `0 12px 60px ${colors.shimmerTo}` };
}

function fadeClass(visible: boolean): string {
  // alpha-ledger:exempt — motion fade endpoints (visible/hidden transition pair)
  return visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-enter-md';
}

function fadeStyle(visible: boolean, delayMs: number): React.CSSProperties {
  return visible ? { transitionDelay: `${delayMs}ms` } : {};
}

/**
 * Test seam — pure helpers + alpha-ledger handles, exposed so the
 * adoption test can pin the phase→className map deterministically
 * without spinning up a phase machine. Mirrors the CaptionMetric
 * `__testing__` idiom (Mike #38 §5).
 */
export const __testing__ = {
  phaseClass,
  WHISPER_TEXT,
  BORDER_HAIRLINE,
  BORDER_MUTED,
} as const;

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
