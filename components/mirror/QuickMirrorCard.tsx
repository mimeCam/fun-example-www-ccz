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
import { MOTION } from '@/lib/design/motion';
import { alphaClassOf } from '@/lib/design/alpha';

/* ─── Alpha-ledger handles (JIT-safe literals via alphaClassOf) ──────────
   Module-scope bindings so the JSX + `phaseClass` map below stay plain
   className compositions and Tailwind's JIT sees every literal in source.
   Mirrors the `MirrorRevealCard` convention (Mike napkin #19 §4.2 — pair
   rule: shimmer/reveal/rest share ONE rung family on the gold border).

   Calibration (Tanya UX §3, alpha.ts felt-sentence block):
     • DIVIDER_HAIRLINE — "it's geometry; the eye registers it as space."
     • WHISPER_TEXT     — "content, but not THE content" (the closing of the card).
     • BORDER_HAIRLINE  — same: a border IS a line. Emergence whispers itself in.
     • BORDER_MUTED     — "ambient chrome; skip past it." Earned-attention rung.
   Pinned in `__tests__/QuickMirrorCard.alpha.test.ts`. */
const DIVIDER_HAIRLINE = alphaClassOf('gold',       'hairline', 'bg');     // bg-gold/10
const WHISPER_TEXT     = alphaClassOf('foreground', 'quiet',    'text');   // text-foreground/70
const BORDER_HAIRLINE  = alphaClassOf('gold',       'hairline', 'border'); // border-gold/10
const BORDER_MUTED     = alphaClassOf('gold',       'muted',    'border'); // border-gold/30

interface Props {
  result: QuickMirrorResult;
  articleId?: string;
}

export default function QuickMirrorCard({ result, articleId }: Props) {
  const { phase, showContent, showShares } = useMirrorPhases(QUICK_TIMINGS);
  const [dismissed, setDismissed] = useState(false);
  const colors = ARCHETYPE_COLORS[(result.archetype as ArchetypeKey) ?? 'collector'];

  if (dismissed) return (
    <div className={`my-sys-8 mx-auto max-w-divider h-px ${DIVIDER_HAIRLINE} rounded-sys-full`} />
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
  // typography-ledger:exempt — icon glyph (×), no reading rhythm; leading-none
  // collapses the line-box around a single character. Not a beat candidate.
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
    <h2 className={`mt-sys-3 text-sys-h2 font-display font-sys-display tracking-sys-heading
      ${visible ? 'mirror-archetype-label' : fadeClass(false)}`}
      style={{ ...fadeStyle(visible, MOTION.instant), color: visible ? color : undefined }}>
      {label}
    </h2>
  );
}

function WhisperQuote({ text, visible }: { text: string; visible: boolean }) {
  // Alpha ledger: `quiet` (0.70) — "content, but not THE content."
  // The whisper is the closing of the card; the archetype name above is THE
  // content. /80 was drift; same rung as MirrorRevealCard's whisper-quote.
  return (
    <p className={`mt-sys-3 text-sys-caption ${WHISPER_TEXT} italic max-w-card-body
      mx-auto typo-caption ${fadeClass(visible)}`}
      style={fadeStyle(visible, MOTION.enter)}>
      &ldquo;{text}&rdquo;
    </p>
  );
}

function GoldDivider({ visible, color }: { visible: boolean; color: string }) {
  // Alpha ledger rung `muted` — "ambient chrome; skip past it."
  // The divider is chrome between mirror sections, not subject; the Tailwind
  // `opacity-muted` bridge replaces the prior raw inline-style literal.
  return (
    <div className={`my-sys-7 h-px max-w-divider mx-auto transition-transform duration-fade opacity-muted
      ${visible ? 'scale-x-100' : 'scale-x-0'}`}
      style={{ backgroundColor: visible ? color : undefined }} />
  );
}

/* ─── Style helpers ──────────────────────────────────────── */

function cardBase(): string {
  return 'relative my-sys-10 mx-auto max-w-card p-sys-7 text-center'
    + ' thermal-radius-wide border bg-gradient-to-b from-surface to-background'
    + ' transition-all duration-reveal ease-out';
}

function phaseClass(p: Phase): string {
  // Tanya §2.2: reveal/rest settle into the ambient gold room — flat halo,
  // not lift. Depth's "I am a reveal" whisper belongs to the prior shimmer
  // phase (archetype-tinted, still exempt per §5 carve-out below).
  // alpha-ledger:exempt — motion fade endpoints (hidden → shimmer/reveal/rest
  // ride Motion's opacity axis). `emergence` uses `opacity-quiet` (0.70) —
  // the "content-but-not-the-content" rung — because the card is legible
  // at that tier before the shimmer brings it to full presence.
  // Borders: hairline (0.10) on emergence, muted (0.30) on shimmer/reveal/rest.
  // Pair-rule (Mike napkin #19 §4.2): every "earned-attention" phase shares
  // ONE rung — splitting rungs across shimmer/reveal/rest would read as the
  // card flickering between definitions. Drift `/20` was equidistant from
  // /10 and /30; it ties down by `snapToRung` but the *intent* is progressive
  // presence — emergence (hairline) → shimmer/reveal/rest (muted), the card
  // gaining definition exactly once (Mike napkin #47 §3 footnote ²).
  const map: Record<Phase, string> = {
    hidden:    'opacity-0 translate-y-enter-md border-transparent',
    emergence: `opacity-quiet translate-y-0 ${BORDER_HAIRLINE}`,
    shimmer:   `opacity-100 translate-y-0 ${BORDER_MUTED} mirror-card-shimmer`,
    reveal:    `opacity-100 translate-y-0 ${BORDER_MUTED} shadow-sys-bloom`,
    rest:      `opacity-100 translate-y-0 ${BORDER_MUTED} shadow-sys-bloom`,
  };
  return map[p];
}

/* Archetype-colored shimmer — Tanya §5 carve-out: mirror cards mid-shimmer
   may tint the bloom beat with the active archetype color. ONE exception.
   Shape mirrors `bloom` (12px offset + wide blur), color is archetype-tinted
   instead of gold. Other beats stay strictly ledger-bound.
   elevation-ledger:exempt — archetype-tint carve-out per Tanya §5. */
function shimmerStyle(p: Phase, colors: { shimmerTo: string }): React.CSSProperties {
  if (p !== 'shimmer') return {};
  return { boxShadow: `0 12px 60px ${colors.shimmerTo}` };
}

function fadeClass(visible: boolean): string {
  const base = 'transition-all duration-fade';
  // alpha-ledger:exempt — motion fade endpoints (visible/hidden transition pair)
  return visible ? `${base} opacity-100 translate-y-0` : `${base} opacity-0 translate-y-enter-sm`;
}

function fadeStyle(visible: boolean, delayMs: number): React.CSSProperties {
  return visible ? { transitionDelay: `${delayMs}ms` } : {};
}

/**
 * Test seam — pure helpers + alpha-ledger handles, exposed so the per-file
 * adoption test can pin the phase→className map deterministically without
 * spinning up a phase machine. Mirrors the `MirrorRevealCard.__testing__`
 * idiom (Mike napkin #19 §5; #47 §6 — failure-message-is-the-doc).
 */
export const __testing__ = {
  phaseClass,
  DIVIDER_HAIRLINE,
  WHISPER_TEXT,
  BORDER_HAIRLINE,
  BORDER_MUTED,
} as const;
