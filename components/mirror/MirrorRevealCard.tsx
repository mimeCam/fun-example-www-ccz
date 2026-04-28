/**
 * MirrorRevealCard — the singular archetype reveal surface, on `/mirror`.
 *
 * One card, one room (Tanya UX "One Mirror, One Room"). Both the warm
 * branch (`mirror`) and the cold branch (`quickMirror` adapted by
 * `app/mirror/page.tsx`) render this component; the inline-end-of-article
 * sibling (`QuickMirrorCard.tsx`) was retired in Sid's pass — its file
 * had been an orphan the reader never met. Share actions appear 600ms
 * after rest; reduced-motion collapses that stagger to 0 in the same
 * effect tick (`useMirrorPhases`).
 */

'use client';

import type { ReaderMirror } from '@/types/mirror';
import type { ArchetypeKey } from '@/types/content';
import type { QuickMirrorResult } from '@/lib/mirror/quick-synthesize';
import { ARCHETYPE_COLORS } from '@/lib/content/content-layers';
import { useMirrorPhases, MIRROR_PAGE_TIMINGS, type Phase } from '@/lib/hooks/useMirrorPhases';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import ShareOverlay from './ShareOverlay';
import { Divider } from '@/components/shared/Divider';
import { alphaClassOf } from '@/lib/design/alpha';
import { gestureClassesForMotion } from '@/lib/design/gestures';
import { thermalRadiusClassByPosture } from '@/lib/design/radius';
import {
  staggerClassOf,
  STAGGER_DATA_PROPS,
  type StaggerRung,
} from '@/lib/design/stagger';
import { wrapClassOf } from '@/lib/design/typography';

/* ─── Alpha-ledger handles (JIT-safe literals via alphaClassOf) ──────────
   Pinned at module scope so the `phaseClass` map below stays a plain
   Record<Phase,string> and Tailwind's JIT sees every literal in source.
   Mike napkin #19 §4.2 — pair-rule: all four phases share one rung family. */
const BORDER_HAIRLINE = alphaClassOf('gold', 'hairline', 'border'); // border-gold/10
const BORDER_MUTED    = alphaClassOf('gold', 'muted',    'border'); // border-gold/30
const WHISPER_TEXT    = alphaClassOf('foreground', 'quiet', 'text'); // text-foreground/70

/* ─── Whisper wrap policy (Mike #122 §4) ────────────────────────────────
   The whisper line is `caption` rhythm but `heading` break policy —
   ragged, balanced, no orphans at 320px. The asymmetry routes through
   the typography ledger's `wrapClassOf` so the contract is one literal,
   one home, one grep-fence (`whisper-typography-converges.fence.test.ts`).
   Tanya UIX #22 §4.2: wrap is the orphan killer; leading stays at caption. */
const WHISPER_WRAP = wrapClassOf('heading');

/* ─── Radius-ledger handle — typed posture, JIT-safe ────────────────────
   Mike napkin #63 §5.1: hoist the resolved class string to module scope
   with UPPER_SNAKE provenance. Posture vocabulary (`ceremony`) is the
   reviewer-facing word; the helper resolves to the thermal-lifted wide
   rung at runtime. The class literal lives once in `lib/design/radius.ts`
   (line 144) so Tailwind JIT scans it there. Output bytes: identical.
   (Tanya UX #53 §3 — pixel / breath / shadow parity is the contract.) */
const THERM_CEREMONY = thermalRadiusClassByPosture('ceremony');

interface Props {
  mirror: ReaderMirror;
  articleId?: string;
}

export default function MirrorRevealCard({ mirror, articleId }: Props) {
  const { phase, showContent, showShares } = useMirrorPhases(MIRROR_PAGE_TIMINGS);
  const reduce = useReducedMotion();
  const colors = ARCHETYPE_COLORS[(mirror.archetype as ArchetypeKey) ?? 'collector'];
  const shareResult = buildShareResult(mirror);
  // Mike #95 §6 — leaves are dumb about reduced-motion; CSS owns the floor.
  const fadeMotion = `transition-all ${FADE_GESTURE(reduce)}`;

  return (
    <div className="flex justify-center">
      <div className={`
        relative max-w-md w-full ${THERM_CEREMONY} p-sys-8 text-center
        bg-gradient-to-b from-surface to-background overflow-hidden
        transition-all ${REVEAL_GESTURE(reduce)}
        ${phaseClass(phase)}
      `}
        style={shimmerStyle(phase, colors, reduce)}>
        <RevealLabel visible={showContent} color={colors.hex} motion={fadeMotion} />
        <ArchetypeName label={mirror.archetypeLabel} visible={showContent} color={colors.hex} />
        <WhisperQuote text={mirror.whisper} visible={showContent} motion={fadeMotion} />
        {/* Divider — the section-divider primitive (Sid · Tanya UIX #28
            §3.2 / Mike #37 §5). The archetype-tinted dialect this card used
            to speak (`<GoldDivider color={colors.hex}>`) retired with the
            kernel landing — Tanya's veto: warmth lives in the surrounding
            card glow, the archetype name's hue, and the GoldenThread on the
            page edge; the divider stays gold/10 like everywhere else.
            Layer separation is what makes layers feel right. */}
        <Divider.Reveal visible={showContent} reduce={reduce} spacing="sys-6" />
        {showShares && <ShareOverlay result={shareResult} articleId={articleId} />}
      </div>
    </div>
  );
}

/* ─── Verb-resolved class fragments ───────────────────────────────────────
   Mike napkin #88 §1: every transition's (duration, ease) pair routes
   through the verb registry, branched on `prefers-reduced-motion`. The two
   verbs the card consumes:

     • `reveal-keepsake` — the card itself (the killer-feature carrier).
     • `fade-neutral`    — the inner content cascade (label, whisper,
                            divider) — *one dissolves while another arrives*.

   Both pre-resolve to JIT-visible literal strings via the (perform / shorten)
   table in `lib/design/gestures.ts`. */
const REVEAL_GESTURE = (r: boolean): string => gestureClassesForMotion('reveal-keepsake', r);
const FADE_GESTURE   = (r: boolean): string => gestureClassesForMotion('fade-neutral',    r);

/* ─── Inner-cascade stagger → paint class (Stagger Ledger lookup) ─────────
   Class strings come from `lib/design/stagger.ts` for the `reveal` family.
   Delays live in `app/globals.css` (1→0ms · 2→`--sys-time-instant` ·
   3→`--sys-time-enter`); the reduced-motion floor is one
   `[data-sys-stagger]` selector under one @media block. The
   `data-sys-stagger` attribute on each rung is the silence hook. */
const MIRROR_STAGGER_CLASS: Readonly<Record<StaggerRung, string>> = {
  1: staggerClassOf({ family: 'reveal', rung: 1 }),
  2: staggerClassOf({ family: 'reveal', rung: 2 }),
  3: staggerClassOf({ family: 'reveal', rung: 3 }),
};

/* ─── Sub-components (each ≤ 10 lines) ──────────────────── */

function RevealLabel({ visible, color, motion }: {
  visible: boolean; color: string; motion: string;
}) {
  // `style={…}` carries archetype-runtime values only (color, opacity rung) —
  // no motion timing tokens. Tanya UX §4e.
  return (
    <p className={`text-sys-micro uppercase tracking-sys-caption mb-sys-2
      ${MIRROR_STAGGER_CLASS[1]} ${motion} ${fadeClass(visible)}`}
      style={{ color, opacity: visible ? 0.7 : 0 }}
      {...STAGGER_DATA_PROPS}>
      Because you stayed…
    </p>
  );
}

function ArchetypeName({ label, visible, color }: {
  label: string; visible: boolean; color: string;
}) {
  // Visible state rides the bespoke `mirror-archetype-label` keyframe —
  // paint, not gesture (Tanya UX §5.3). `mirror-stagger-2` is a no-op while
  // the keyframe wins, correct on the visible→false edge (Mike #95 §5 #4).
  return (
    <h2 className={`text-sys-h3 font-display font-sys-display tracking-sys-heading
      ${MIRROR_STAGGER_CLASS[2]}
      ${visible ? 'mirror-archetype-label' : fadeClass(false)}`}
      style={{ color }}
      {...STAGGER_DATA_PROPS}>
      {label}
    </h2>
  );
}

function WhisperQuote({ text, visible, motion }: {
  text: string; visible: boolean; motion: string;
}) {
  // Alpha ledger: `quiet` (0.70) — "content, but not THE content."
  // The whisper is a quote; archetype name above is THE content. /80 was drift.
  // Wrap policy: heading-balanced via `WHISPER_WRAP` so the felt sentence
  // never orphans a final word at 320px (Mike #122 §4 / Tanya UIX #22 §2).
  return (
    <p className={`mt-sys-3 text-sys-caption ${WHISPER_TEXT} italic max-w-card-body
      mx-auto typo-caption ${WHISPER_WRAP} ${MIRROR_STAGGER_CLASS[3]} ${motion} ${fadeClass(visible)}`}
      {...STAGGER_DATA_PROPS}>
      &ldquo;{text}&rdquo;
    </p>
  );
}

/* `GoldDivider` retired (Sid · Tanya UIX #28 §3.2 / Mike #37 §5): the
   section-divider primitive moved to `<Divider.Reveal />`. The archetype-
   tinted dialect (the `style={{ backgroundColor }}` hex hatch + the
   `opacity-muted` rung that diverged from the gold/10 single-rung
   doctrine) retires with the lift. The kernel owns geometry, motion, and
   the reduced-motion floor in one place. Six near-duplicates collapse to
   one frozen primitive. */

/* ─── Helpers ───────────────────────────────────────────── */

function phaseClass(p: Phase): string {
  // Tanya §2.3: the room is warming (bloom), not lifting. The reveal
  // gesture lives in the prior shimmer phase.
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
   Shape mirrors `bloom`; color is archetype-driven instead of gold.
   Reduced-motion (Tanya UX §4.1): skip the archetype-tinted shimmer beat
   entirely — render at rest-state shadow only. The card's CSS `box-shadow`
   transition still rides `gestureClassesForMotion` so the swap is gentle. */
function shimmerStyle(
  p: Phase, colors: { shimmerTo: string }, reduce: boolean,
): React.CSSProperties {
  if (reduce || p !== 'shimmer') return {};
  return { boxShadow: `0 12px 60px ${colors.shimmerTo}` };
}

function fadeClass(visible: boolean): string {
  // alpha-ledger:exempt — motion fade endpoints (visible/hidden transition pair)
  return visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-enter-md';
}

/* `fadeStyle()` retired (Mike #95 §1): the cascade's transition-delay moved
   onto `.mirror-stagger-1|2|3` in `app/globals.css`. The component owns no
   millisecond literal; the kernel owns the cadence. */

/**
 * Test seam — pure helpers + alpha-ledger handles + verb-resolved class
 * fragments, exposed so adoption tests can pin the phase→className map and
 * the gesture-resolution branches deterministically without spinning up a
 * phase machine. Mirrors the CaptionMetric `__testing__` idiom (Mike #38 §5).
 *
 * Verb resolvers: `REVEAL_GESTURE(reduce)` and `FADE_GESTURE(reduce)` —
 * the two consumer branches the killer-feature carrier exercises. Pinned
 * by `MirrorRevealCard.gestures.test.ts` per Mike napkin #88 §4.2.
 */
export const __testing__ = {
  phaseClass,
  shimmerStyle,
  REVEAL_GESTURE,
  FADE_GESTURE,
  MIRROR_STAGGER_CLASS,
  WHISPER_TEXT,
  WHISPER_WRAP,
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
