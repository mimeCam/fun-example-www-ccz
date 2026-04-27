'use client';

import type React from 'react';
import Link from 'next/link';
import { Article } from '@/lib/content/ContentTagger';
import { estimateReadingTime } from '@/lib/content/ContentTagger';
import { excerpt } from '@/lib/content/excerpt';
import { useScrollRise } from '@/lib/hooks/useScrollRise';
import { formatReadingTime } from '@/lib/utils/reading-time';
import { CaptionMetric } from '@/components/shared/CaptionMetric';
import { alphaClassOf } from '@/lib/design/alpha';
import { thermalRadiusClassByPosture } from '@/lib/design/radius';
import { gestureClassesOf } from '@/lib/design/gestures';
import {
  WORLDVIEW_COLORS,
  WORLDVIEW_FALLBACK_BG,
  worldviewChipClass,
  worldviewChipLabel,
  worldviewChipGlyph,
  worldviewChipGlyphClass,
} from '@/lib/design/worldview';

interface ExploreArticleCardProps {
  article: Article;
  /** Position in section — drives scroll-rise stagger delay. */
  index?: number;
  variant?: 'default' | 'curated';
  /** Kept for backward compatibility — CuratedRow no longer passes this. */
  reason?: string;
  showWorldview?: boolean;
}

/* ─── Alpha-ledger handles (JIT-safe literals via alphaClassOf) ──────────
   Mike napkin #50 §4 + Tanya UX #58 §4 — the pair-invariant rule pins
   CURATED_HOVER and ORGANIC_HOVER to the SAME rung token (`recede`); only
   the family differs. Hover communicates *interactivity*; the family
   carries *category*. Two channels, two jobs, no overload.

   Calibration (alpha.ts felt-sentence block):
     CURATED_REST  — `muted`    → "ambient warmth; the eye registers it."
     CURATED_HOVER — `recede`   → "frame around the subject; lean in."
     ORGANIC_REST  — `hairline` → "it's geometry; space, not surface."
     ORGANIC_HOVER — `recede`   → SAME rung as CURATED_HOVER (pair invariant).

   Worldview chip chrome lives in `lib/design/worldview.ts` (Mike #51,
   Tanya #58 §6) — single typed home keyed by `FilterType`. Imported
   above; the test seam below re-exports for backward-compat with the
   existing `__tests__/ExploreArticleCard.alpha.test.ts`. */
const CURATED_REST    = alphaClassOf('gold', 'muted',    'border'); // border-gold/30
const CURATED_HOVER   = alphaClassOf('gold', 'recede',   'border'); // border-gold/50
const ORGANIC_REST    = alphaClassOf('fog',  'hairline', 'border'); // border-fog/10
const ORGANIC_HOVER   = alphaClassOf('fog',  'recede',   'border'); // border-fog/50

/* ─── Radius-ledger handle (posture-routed thermal corner) ──────────────────
   `thermal-radius` graduates from raw literal to a posture-vocabulary handle.
   The reviewer asks "what is this corner saying?" — the answer is `held`:
   "I am a contained thing you can act on." (RadiusPosture lock, radius.ts §9.)

   Module-scope so the binding evaluates once; Tailwind JIT still sees the
   verbatim `'thermal-radius'` literal through `radius.ts` source. Output is
   byte-identical — the card paints the same corner. (Mike napkin §92, Tanya
   UX §4.1, posture-card cadence: ExploreArticleCard → MirrorLoadingSurface
   → mirror/page.tsx → press-phase.ts.) */
const THERM_HELD = thermalRadiusClassByPosture('held');

/* ─── Gesture-Atlas handle (verb-routed transition class) ──────────────────
   `title-warm` verb (Tanya UX #78 §2.3): "The room's accent voice reaches
   this title first — color, not shape." duration-crossfade (120ms), ease-out.
   Module-scope binding so the call is greppable at the source level (Tailwind
   JIT and the `gesture-call-site-fence` both rely on the literal verb being
   visible OUTSIDE the template — same convention as `alphaClassOf` calls
   above; same convention as `thermalRadiusClassByPosture('held')` below). */
const TITLE_WARM = gestureClassesOf('title-warm');

/**
 * Card edge class — one decision, two voices. Hover variants are written
 * as literals (Tailwind JIT cannot see `hover:${X}` interpolation; the full
 * token must appear verbatim in source). Gold/fog hue is the suprathreshold
 * signal carrying the curated/organic split; the rung pair is the lock that
 * keeps it from drifting back into noise. Pure, ≤ 10 LOC.
 */
function edgeClass(isCurated: boolean): string {
  // alpha-ledger:exempt — JIT mirror of CURATED_REST/CURATED_HOVER (and the
  // ORGANIC_REST/ORGANIC_HOVER pair). Tailwind's JIT cannot see
  // `hover:${X}` interpolation; the full token must appear verbatim in
  // source. These literals are intentionally byte-identical to the
  // `alphaClassOf` consts above so the compiler picks both spellings up.
  // Mike napkin #113 §6 PoI #3 — option (a), pinned by divider-fence Axis F.
  return isCurated
    ? 'border border-gold/30 hover:border-gold/50 card-alive-curated'
    : 'border border-fog/10 hover:border-fog/50';
}

export default function ExploreArticleCard({
  article,
  index = 0,
  variant = 'default',
  reason,
  showWorldview = false,
}: ExploreArticleCardProps) {
  const minutes   = estimateReadingTime(article.content);
  const summary   = excerpt(article.content, 120);
  const isCurated = variant === 'curated';

  const { ref } = useScrollRise({ index });

  return (
    <Link
      ref={ref as React.RefObject<HTMLAnchorElement>}
      href={`/article/${article.id}`}
      className={`block group ${THERM_HELD}`}
    >
      {/* `${THERM_HELD}` on the anchor itself — so the global :focus-visible
          ring inherits the same curve the inner article surface declares.
          Without it, keyboard-focus would paint a 0-radius box around a
          rounded card. (Honoring-ring audit — Tanya #93 §4, Mike napkin §4.3.)

          `ref` feeds useScrollRise — the hook sets `data-sys-rise="pre"` on
          mount (card invisible) then `data-sys-enter="rise"` on intersection
          (card animates in with stagger). One observer for the whole list.

          ── INVARIANT — DO NOT MOVE `card-alive` ONTO THE <Link> ──────────
          The `.card-alive` family lives on the inner <article>, on purpose.
          The outer <Link> receives `:focus-visible` (the global ring lands
          there); `:focus-within` then fires on the inner <article> and the
          card lifts the same way it does on `:hover` — one selector chain
          covers cursor / touch / keyboard / screen-reader / voice. If a
          future refactor "tidies" the class up onto the <Link>, the
          parent/child relationship `:focus-within` depends on collapses
          and the keyboard reader silently loses the felt acknowledgement.
          The pin: `lib/design/__tests__/card-alive-elevation.test.ts`
          asserts the co-listed `:focus-within` peer in `app/globals.css`,
          and the `THERM_HELD`-on-Link convention above keeps the focus
          ring on the rounded corner. (Mike #92 napkin §2 / §3 risk #2;
          precedent: `KeepsakePlate :focus-within` at globals.css L886.) */}
      <article
        className={`bg-surface ${THERM_HELD} shadow-sys-rest p-sys-6 h-full flex flex-col
          card-alive ${edgeClass(isCurated)}`}
      >
        {/* Tanya §2.4: cards are surfaces, not buttons. Rest → sys-rest
            (grid visibly quieter); hover lift is owned by .card-alive in
            globals.css, so no hover shadow class is needed here. */}
        {/* `title-warm` verb (Gesture Atlas / Tanya UX #78 §2.3):
            "The room's accent voice reaches this title first — color, not shape."
            duration-crossfade (120ms): title color warms before card lifts (200ms).
            Hierarchy: color signal first → surface responds. Tanya §1.2.
            text-thermal-accent = var(--token-accent) = violet dormant → gold luminous.
            Cards warm with the reader — gold is earned, not preset. Tanya §3.1. */}
        <h3 className={`font-display text-foreground font-sys-display text-sys-lg mb-sys-3 group-hover:text-thermal-accent transition-colors ${TITLE_WARM}`}>
          {article.title}
        </h3>

        {reason && (
          <p className="text-gold/70 text-sys-micro italic mb-sys-3">{reason}</p>
        )}

        {summary && (
          <p className="text-mist text-sys-caption typo-caption mb-sys-4 flex-1 line-clamp-3">
            {summary}
          </p>
        )}

        {/* Card metadata row — the duration recedes one alpha-ledger rung
            below the hero (`quiet` = 70%) so it reads as "content, but
            not THE content" (Tanya §3, alpha ledger §quiet). The
            duration span uses `<CaptionMetric>` (Mike #38) so the
            caption-voice, digit-column, and `quiet` rung match the
            hero, mirror MetaLine and article caption — one face. The
            parent retains `text-sys-micro text-mist/70` for the sibling
            separator + tag span to inherit; CaptionMetric's literals
            override on its own element. */}
        <div className="flex items-center gap-sys-3 text-sys-micro text-mist/70">
          <CaptionMetric as="span">
            {formatReadingTime(minutes)}
          </CaptionMetric>
          {showWorldview && article.worldview && (
            <>
              <span className="text-mist/30">·</span>
              {/* Chip text routes through `worldviewChipLabel` (Tanya UX #58 §3.3)
                  so we render `Technical` / `Philosophical` / `Practical` /
                  `Contrarian` — the chip stops looking like a debug tag. The
                  chip chrome routes through `worldviewChipClass` so the
                  fallback can never be forgotten (Mike #51 §5 #4).

                  Glyph leadin (Tanya UX #10 §2 + principle #7): a
                  one-character abstract shape carries the worldview at
                  chip size when color alone collapses (color-blindness,
                  small text, sunlight). `aria-hidden` so the screen
                  reader hears the label, not the shape name. */}
              {/* Tanya UX #62 §4.2: `align-baseline` keeps the chip on the
                  same x-height as the `<CaptionMetric>` neighbour — without
                  it the rounded `py-sys-1` leaves a 1px optical drop. */}
              {/* Tanya UX #62 §4.1: glyph optical lift via
                  `worldviewChipGlyphClass` — `▣` is filled and visibly
                  sinks vs label at `text-sys-micro`; one Tailwind utility
                  handles the compensation without a per-glyph component. */}
              <span className={`px-sys-2 py-sys-1 rounded-sys-soft text-sys-micro font-sys-accent align-baseline ${worldviewChipClass(article.worldview)}`}>
                <span aria-hidden="true" className={worldviewChipGlyphClass(article.worldview)}>{worldviewChipGlyph(article.worldview)}</span>
                {worldviewChipLabel(article.worldview)}
              </span>
            </>
          )}
          {!showWorldview && article.tags && article.tags.length > 0 && (
            <>
              <span className="text-mist/30">·</span>
              <span>{article.tags[0]}</span>
            </>
          )}
        </div>
      </article>
    </Link>
  );
}

/**
 * Test seam — pure helpers + alpha-ledger handles, exposed so the per-file
 * adoption test can pin the card's edge classes deterministically without
 * spinning up the full SSR render. Mirrors the `MirrorRevealCard.__testing__`
 * idiom (Mike napkin #19 §5; #50 §4); the prior sibling
 * `QuickMirrorCard.__testing__` was retired alongside its orphan component
 * (Sid, Tanya UX "One Mirror, One Room").
 */
export const __testing__ = {
  edgeClass,
  WORLDVIEW_COLORS,
  CURATED_REST,
  CURATED_HOVER,
  ORGANIC_REST,
  ORGANIC_HOVER,
  WORLDVIEW_FALLBACK_BG,
  THERM_HELD,
} as const;
