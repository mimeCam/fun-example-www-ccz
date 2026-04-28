/**
 * ResonanceEntry — a single resonance card in the Book of You.
 * Two visual states: alive (carrying) with rose glow, or faded (shaped) with dimmed mist.
 *
 * Scroll-rise: each card lifts into view via `useScrollRise` when it crosses
 * 15% visibility. Section-local `index` drives the stagger wave (50ms × i, cap 300ms).
 * When `index` is undefined, the hook is disabled — no observer, no ref, no timers.
 *
 * Opacity fix: the shaped card drops `opacity-recede` (Tanya UIX #64 §3). Its faded
 * identity is carried by internal color tokens (surface@muted, rose-border@muted,
 * mist gem, no shadow). The wrapper blanket opacity conflicted with scroll-rise's
 * `animation-fill-mode: both` which ends at full presence (opacity 1, the
 * Motion-owned fade endpoint).
 *
 * Quote-card host wiring (Mike #81 §4 / Tanya #75 §9): when the resonance
 * carries a quote, a passage-link below the metadata opens `<QuoteKeepsake>`
 * — the second native speaker of the direct-gesture asymmetry. The dialect
 * matches `<ThreadKeepsake>` byte-for-byte (no success toast on Copy / Save
 * / Link / Share). One verb per quote per card, never a peer to the
 * resonance card itself (Tanya §2.4 — single primary on the surface).
 *
 * Gesture redemption (Sid napkin — Mike #42 / Tanya UIX #53): the card's
 * two transitions now read on the Gesture Atlas. The wrapper's settle is
 * `card-settle` ("the card is drifting back down to sleep"); the vitality
 * fill's % crossfade is `fade-neutral` ("one thing dissolves while another
 * arrives — neither rushing"). Both branch on `useReducedMotion()` via
 * `gestureClassesForMotion`, the same shape `MirrorRevealCard` already
 * uses (Mike napkin #88). A reader who turned motion off no longer feels
 * the card breathing at them.
 *
 * Alpha graduation (Mike napkin #111 + Tanya UIX #80, Sid 2026-04-27): this
 * file is OFF `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS`. The `alive ↔
 * dimmed` pair is now spoken in the role-based 4-rung vocabulary owned by
 * `lib/design/alpha.ts` — every color-alpha literal routes through
 * `alphaClassOf()`. Per Tanya §4 + §10 row A: the surfaces sit exactly
 * one ledger step apart — `recede` (alive, the body in repose) →
 * `muted` (dimmed, ambient chrome the eye skims past). The reader's
 * rose-italic note gains authority because the card around it stepped
 * back a half-rung, not because the note got louder. The two raw
 * dividers retire to `<Divider.Static />` (Tanya §5; one dialect, two
 * utterances, geometry-only). Pinned per-file by `ResonanceEntry.alpha.test.ts`.
 *
 * Credits — alpha graduation: Paul K. (the *"two registers, one rung
 * apart"* sentence and the single polish test that gates the PR), Tanya D.
 * (UIX #80 — the surface step-DOWN doctrine, the gem family-anchor at
 * `quiet`, the divider unification), Mike K. (architect — the JIT-safe
 * literal-table routing, the `__testing__` per-file SSR pin shape, the
 * grandfather-list-only-shrinks discipline), Krystle C. (drift-density
 * pick), Elon M. (insistence that every gate be measurable).
 */
'use client';

import { useCallback, useState, type RefObject } from 'react';
import { TextLink } from '@/components/shared/TextLink';
import { Pressable } from '@/components/shared/Pressable';
import { GemIcon } from '@/components/shared/GemIcon';
import { LeanArrow } from '@/components/shared/LeanArrow';
import { Divider } from '@/components/shared/Divider';
import { CaptionMetric } from '@/components/shared/CaptionMetric';
import { alphaClassOf } from '@/lib/design/alpha';
import { gestureClassesForMotion } from '@/lib/design/gestures';
import { passageThermalClass, wrapClassOf } from '@/lib/design/typography';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useScrollRise } from '@/lib/hooks/useScrollRise';
import { QuoteKeepsake } from '@/components/articles/QuoteKeepsake';
import { resolveLauncherPaint } from '@/lib/resonances/visited-launcher';
import type { QuoteCardData } from '@/lib/quote-cards/card-generator';
import type { ResonanceWithArticle } from '@/types/resonance-display';

interface Props {
  resonance: ResonanceWithArticle;
  timeAgo: string;
  faded?: boolean;
  closingLine?: string;
  /** Section-local position (0-based). Drives stagger delay. Omit to disable animation. */
  index?: number;
  /**
   * Has the reader Saved this resonance's quote-card *this session*?
   * When true, the `<QuoteCardLauncher>` repaints in `gold/quiet`
   * (the visited foreshadow; Tanya UIX #98, Mike #31 §1). Owned by
   * `<ResonancesClient>`'s in-memory Set — refresh forgets, by intent.
   */
  visited?: boolean;
  /**
   * Fired when the reader hits Save (download) inside `<QuoteKeepsake>`
   * and the file lands. Threaded straight into the Keepsake host's
   * `onSaved` so the parent can mark this resonance visited. Save is
   * the one artifact verb on this surface — no `onShared` / `onCopied`
   * peer (Mike #31 §10).
   */
  onSaved?: () => void;
}

// ─── Module-level alpha-ledger handles (JIT-safe literals) ────────────────
//
// Per Mike napkin #111 §4 (mirror of `<MirrorRevealCard>` BORDER_HAIRLINE /
// `<Divider>` HAIRLINE_BG handles): every ledger crossing on this surface
// resolves once, here, against `alphaClassOf()`. The `__testing__` export
// hands these to `ResonanceEntry.alpha.test.ts` so the per-file SSR pin
// asserts against named tokens, not magic strings. Tiny grep-able homes.
//
// Pair-rule: ALIVE_CHASSIS sits at `recede` (0.50), DIMMED_CHASSIS at
// `muted` (0.30) — exactly one ledger step apart (Tanya §10 row A). The
// reader's rose-italic note (passageThermalClass, default presence) gains
// authority because the chassis around it stepped DOWN a half-rung
// (Tanya §4: "free authority"), not because the note got louder.

/** Surface paint at `recede` — the body in repose. */
const ALIVE_SURFACE = alphaClassOf('surface', 'recede', 'bg');

/** Surface paint at `muted` — ambient chrome, the eye skims past. */
const DIMMED_SURFACE = alphaClassOf('surface', 'muted', 'bg');

/** Border ribbon at `muted` — the warmth has cooled, the print remains. */
const DIMMED_BORDER = alphaClassOf('rose', 'muted', 'border');

/** Alive chassis — recede surface, full-presence rose ribbon, two-layer glow. */
const ALIVE_CHASSIS = `${ALIVE_SURFACE} border-l-4 border-rose resonance-card-alive`;

/** Dimmed chassis — muted surface, muted ribbon, no glow. */
const DIMMED_CHASSIS = `${DIMMED_SURFACE} border-l-4 ${DIMMED_BORDER}`;

/** Vitality bar track — `muted` rung; ambient chrome the eye skims past. */
const VITALITY_TRACK = alphaClassOf('fog', 'muted');

/** Gem paint at `quiet` for alive — content, but not THE content. */
const GEM_ALIVE = alphaClassOf('rose', 'quiet', 'text');

/** Gem paint at `quiet` for dimmed — same rung, family swap (visited-launcher precedent). */
const GEM_DIMMED = alphaClassOf('mist', 'quiet', 'text');

/** Quoted-line text — `quiet` rung; the article speaking, not the reader. */
const QUOTED_LINE_TEXT = alphaClassOf('foreground', 'quiet', 'text');

/** Closing-line text — `recede` rung; the room's small farewell. */
const CLOSING_LINE_TEXT = alphaClassOf('gold', 'recede', 'text');

/* ─── Wrap policy — `caption` rhythm, `heading` break (Mike #122 §4) ────────
   The `CardLabel` eyebrow is caption-rhythm chapter signage: multi-word
   variants (Something that stayed with you) cannot orphan a final word at
   320 px; single-word variants (Faded) get a silent CSS no-op. The literal
   `typo-wrap-heading` lives in `wrapClassOf` only; pinned by
   `caption-heading-wrap-converges.fence.test.ts`. */
const HEADING_WRAP = wrapClassOf('heading');

/** Small gem icon for the card label. Pure presentation, ≤ 5 LOC. */
function CardGem({ faded }: { faded?: boolean }) {
  return <GemIcon size="xs" className={faded ? GEM_DIMMED : GEM_ALIVE} />;
}

/** Vitality bar — rose gradient for alive, empty track for faded. */
function VitalityBar(
  { vitality, faded, reduce }: { vitality: number; faded?: boolean; reduce: boolean },
) {
  const trackClass = `h-1.5 rounded-sys-full ${VITALITY_TRACK} w-full`;
  if (faded) return <div className={trackClass} />;

  const pct = Math.min(100, Math.round((vitality / 30) * 100));
  return (
    <div className={`${trackClass} overflow-hidden`}>
      <div
        className={`h-full rounded-sys-full bg-gradient-to-r from-rose to-rose/60 transition-all ${gestureClassesForMotion('fade-neutral', reduce)}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ResonanceEntry({
  resonance, timeAgo, faded, closingLine, index, visited, onSaved,
}: Props) {
  // Scroll-rise: disabled when index is undefined (backward-compat with call-sites
  // that don't pass an index). When enabled, hides the card on mount and reveals
  // it with a 12px lift + opacity fade once 15% of the card enters the viewport.
  const { ref } = useScrollRise({ index: index ?? 0, disabled: index === undefined });
  const keepsake = useQuoteKeepsakeState();
  // Reduced-motion: read once at the surface and thread the boolean to the
  // two transitions on this card. `card-settle` is a `skip` policy under
  // reduce (the return-phase exhale lands instantly); `fade-neutral` is
  // `shorten` (the % crossfade compresses to the 120ms floor). Same shape
  // as `MirrorRevealCard` (Mike napkin #88).
  const reduce = useReducedMotion();

  return (
    <div ref={ref as RefObject<HTMLDivElement>} className={cardClass(faded, reduce)}>
      <CardLabel faded={faded} />
      {resonance.quote && <QuotedLine text={resonance.quote} />}
      <Divider.Static spacing="sys-4" />
      <ReaderNote note={resonance.resonanceNote} />
      <Divider.Static spacing="sys-4" />
      <ArticleMeta resonance={resonance} timeAgo={timeAgo} />
      <div className="mt-sys-4">
        <VitalityBar vitality={resonance.vitality} faded={faded} reduce={reduce} />
      </div>
      {!faded && resonance.quote && (
        <QuoteCardLauncher onOpen={keepsake.open} visited={visited} />
      )}
      {faded && closingLine && <ClosingLine line={closingLine} />}
      <QuoteKeepsake
        isOpen={keepsake.isOpen}
        onClose={keepsake.close}
        data={resonance.quote ? buildCardData(resonance) : null}
        deepLink={`/article/${resonance.articleId}`}
        onSaved={onSaved}
      />
    </div>
  );
}

// ─── Card chrome — pure presentation, ≤ 10 LOC each ───────────────────────

/**
 * `resonance-card-alive` replaces `shadow-rose-glow`: two-layer box-shadow
 * (outer belt + inner thermal pulse via `--token-resonance-glow-alive`).
 * `opacity-recede` removed from `dimmed` — the faded state is carried by
 * the chassis tokens above (Tanya UIX #64 §3 + #80 §4).
 *
 * The `alive ↔ shaped` swap rides the `card-settle` verb — *"the card is
 * drifting back down to sleep"* — branched on `prefers-reduced-motion` so
 * the return phase lands instantly when the reader has motion off.
 *
 * Pair-rule (Tanya UIX #80 §4 + §10 row A): ALIVE_CHASSIS sits at `recede`,
 * DIMMED_CHASSIS at `muted` — exactly one ledger step apart. The chassis
 * literals live at module scope so the `__testing__` export can pin both
 * registers to named tokens (no magic strings). Pure, ≤ 5 LOC.
 */
function cardClass(faded: boolean | undefined, reduce: boolean): string {
  const settle = gestureClassesForMotion('card-settle', reduce);
  const base = `rounded-sys-medium p-sys-7 my-sys-8 transition-all ${settle}`;
  return `${base} ${faded ? DIMMED_CHASSIS : ALIVE_CHASSIS}`;
}

function CardLabel({ faded }: { faded?: boolean }) {
  return (
    <div className="flex items-center gap-sys-3 mb-sys-4">
      <CardGem faded={faded} />
      <span className={`text-sys-micro uppercase tracking-sys-caption text-mist ${HEADING_WRAP}`}>
        {faded ? 'Faded' : 'Something that stayed with you'}
      </span>
    </div>
  );
}

function QuotedLine({ text }: { text: string }) {
  return (
    <p className={`${QUOTED_LINE_TEXT} italic text-sys-body max-w-prose-sm mb-sys-4`}>
      &ldquo;{text}&rdquo;
    </p>
  );
}

function ReaderNote({ note }: { note: string }) {
  return (
    <p className={`text-rose italic text-sys-body ${passageThermalClass()} mb-sys-5`}>
      {note}
    </p>
  );
}

/**
 * Caption-chrome adoption (Tanya UX §"What changes at the call site",
 * Mike napkin §"Carrier enumeration"): the timestamp line wears the named
 * register through `<CaptionMetric>` so eight Saved-N-days-ago lines down
 * a /resonances list lock their digits in a column-stable gutter
 * (`tabular-nums` advance-width). The hand-rolled `<p text-sys-micro>` +
 * `text-mist/recede` literal has retired. One swap, one line, zero new
 * chrome — the alpha rung crossing recede→quiet is the primitive's sealed
 * contract (Mike #38 — two knobs, no `tone` prop). Pinned by
 * `caption-chrome-adoption.fence.test.ts`.
 */
function ArticleMeta({ resonance, timeAgo }: { resonance: ResonanceWithArticle; timeAgo: string }) {
  return (
    <>
      <TextLink variant="inline" href={`/article/${resonance.articleId}`}
        className="text-sys-caption font-sys-accent">
        {resonance.articleTitle}
      </TextLink>
      <CaptionMetric as="p" className="mt-sys-1">{timeAgo}</CaptionMetric>
    </>
  );
}

function ClosingLine({ line }: { line: string }) {
  return (
    <p className={`mt-sys-5 ${CLOSING_LINE_TEXT} italic text-sys-micro typo-caption`}>
      {line}
    </p>
  );
}

// ─── Quote-card host wiring ───────────────────────────────────────────────

/**
 * Modal open/close state for the QuoteKeepsake host. Same shape as
 * `useDrawerState` in `<SelectionPopover>` so any future contributor sees
 * one canonical pattern (Sid lab rule: tiny hook, ≤ 10 LOC, grep-able home).
 */
function useQuoteKeepsakeState() {
  const [isOpen, setIsOpen] = useState(false);
  const open  = useCallback(() => setIsOpen(true),  []);
  const close = useCallback(() => setIsOpen(false), []);
  return { isOpen, open, close };
}

/**
 * Build `QuoteCardData` from a resonance row. The article has no author
 * field today (`Article` interface in `ContentTagger.ts`), so the byline
 * folds to the article title and the blog brand carries the corner.
 *
 * // TODO: when articles gain a typed `author` field, surface it here so
 * the card paints "— <author>" instead of "— <article title>".
 */
function buildCardData(r: ResonanceWithArticle): QuoteCardData {
  return {
    quote: r.quote ?? '',
    author: r.articleTitle,
    articleTitle: r.articleTitle,
    blogName: 'theanti.blog',
  };
}

/**
 * The launcher itself — one ghost text-link, single verb, single direction.
 * Lives below the vitality bar so it never competes with the card's own
 * presence (Tanya §75 §2.4 — single primary on the surface; this is the
 * passage-link, not a primary CTA).
 *
 * `visited` repaints the launcher in `text-gold/quiet` for the rest of
 * the session once the keepsake has been Saved (the visited foreshadow;
 * Tanya UIX #98 §2). One pure resolver, one boolean, one class swap —
 * no fork to a `VisitedQuoteCardLauncher` variant (Mike #31 §11). The
 * `aria-label` is unchanged: the paint is the sentence, not a copy
 * change (Tanya #98 §4).
 *
 * The `<LeanArrow />` kernel (`components/shared/LeanArrow.tsx`) wears
 * `.lean-arrow` so the site-wide nudge rule (`globals.css`,
 * detached from `.plate-destination` per Mike #43 §6 + Tanya UX §5)
 * translates the arrow 2px right on `:focus-within`. The launcher itself
 * stays a ghost — no halo, no dwell, no elevation. Only the glyph leans.
 * `aria-hidden` (owned by the kernel) keeps screen readers on the verb
 * ("Save as card"), not the ornament. The leading space lives INSIDE the
 * kernel's span (Tanya §5.1) — caller drops the manual trailing space.
 */
function QuoteCardLauncher(
  { onOpen, visited }: { onOpen: () => void; visited?: boolean },
) {
  const paint = resolveLauncherPaint(visited === true);
  return (
    <div className="mt-sys-4 flex justify-end">
      <Pressable
        variant="ghost"
        size="sm"
        onClick={onOpen}
        aria-label="Save this quote as a card"
        className={`${paint} text-sys-micro`}
      >
        Save as card<LeanArrow />
      </Pressable>
    </div>
  );
}

// ─── Test seam — pure handles for the per-file SSR alpha pin ─────────────
//
// Mirrors `ThreadKeepsake.__testing__` (Mike napkin #92 / #110 §4) — tiny
// named handles let `ResonanceEntry.alpha.test.ts` assert against the
// canonical `alphaClassOf(...)` literals AND the expected wire strings. A
// future swap of the rung vocabulary cannot silently shift either register
// without flipping the per-file pin.
//
// Pair-rule (Tanya UIX #80 §10 row A): `ALIVE_CHASSIS` carries
// `alphaClassOf('surface','recede','bg')` and `DIMMED_CHASSIS` carries
// `alphaClassOf('surface','muted','bg')`. The two rungs sit exactly one
// ledger step apart in `ALPHA_ORDER`. Pinned by §4 of the test.
export const __testing__ = {
  ALIVE_CHASSIS,
  DIMMED_CHASSIS,
  ALIVE_SURFACE,
  DIMMED_SURFACE,
  DIMMED_BORDER,
  VITALITY_TRACK,
  GEM_ALIVE,
  GEM_DIMMED,
  QUOTED_LINE_TEXT,
  CLOSING_LINE_TEXT,
  HEADING_WRAP,
} as const;
