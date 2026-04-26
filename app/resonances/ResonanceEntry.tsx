/**
 * ResonanceEntry — a single resonance card in the Book of You.
 * Two visual states: alive (carrying) with rose glow, or faded (shaped) with dimmed mist.
 *
 * Scroll-rise: each card lifts into view via `useScrollRise` when it crosses
 * 15% visibility. Section-local `index` drives the stagger wave (50ms × i, cap 300ms).
 * When `index` is undefined, the hook is disabled — no observer, no ref, no timers.
 *
 * Opacity fix: the shaped card drops `opacity-recede` (Tanya UIX #64 §3). Its faded
 * identity is carried by four internal color tokens (bg-surface/30, border-rose/30,
 * mist/30 gem, no shadow). The wrapper blanket opacity conflicted with scroll-rise's
 * `animation-fill-mode: both` which ends at full presence (opacity 1, the
 * Motion-owned fade endpoint).
 *
 * Quote-card host wiring (Mike #81 §4 / Tanya #75 §9): when the resonance
 * carries a quote, a passage-link below the metadata opens `<QuoteKeepsake>`
 * — the second native speaker of the direct-gesture asymmetry. The dialect
 * matches `<ThreadKeepsake>` byte-for-byte (no success toast on Copy / Save
 * / Link / Share). One verb per quote per card, never a peer to the
 * resonance card itself (Tanya §2.4 — single primary on the surface).
 */
'use client';

import { useCallback, useState, type RefObject } from 'react';
import { TextLink } from '@/components/shared/TextLink';
import { Pressable } from '@/components/shared/Pressable';
import { GemIcon } from '@/components/shared/GemIcon';
import { alphaClassOf } from '@/lib/design/alpha';
import { passageThermalClass } from '@/lib/design/typography';
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

/** Small gem icon for the card label. */
function CardGem({ faded }: { faded?: boolean }) {
  const color = faded ? 'text-mist/30' : 'text-rose/70';
  return <GemIcon size="xs" className={color} />;
}

/** Vitality bar — rose gradient for alive, empty for faded. */
function VitalityBar({ vitality, faded }: { vitality: number; faded?: boolean }) {
  // Track is ambient chrome — Alpha rung `muted` via the ledger helper,
  // same string emitted as before ("bg-fog/30"), now ledger-sourced.
  const trackClass = `h-1.5 rounded-sys-full ${alphaClassOf('fog', 'muted')} w-full`;
  if (faded) return <div className={trackClass} />;

  const pct = Math.min(100, Math.round((vitality / 30) * 100));
  return (
    <div className={`${trackClass} overflow-hidden`}>
      <div className="h-full rounded-sys-full bg-gradient-to-r from-rose to-rose/60 transition-all duration-fade"
        style={{ width: `${pct}%` }} />
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

  return (
    <div ref={ref as RefObject<HTMLDivElement>} className={cardClass(faded)}>
      <CardLabel faded={faded} />
      {resonance.quote && <QuotedLine text={resonance.quote} />}
      <div className="h-px max-w-divider bg-gold/20 mb-sys-4" />
      <ReaderNote note={resonance.resonanceNote} />
      <div className="h-px bg-fog mb-sys-4" />
      <ArticleMeta resonance={resonance} timeAgo={timeAgo} />
      <div className="mt-sys-4">
        <VitalityBar vitality={resonance.vitality} faded={faded} />
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
 * four internal color tokens (Tanya UIX #64 §3).
 */
function cardClass(faded?: boolean): string {
  const base = 'rounded-sys-medium p-sys-7 my-sys-8 transition-all duration-enter';
  const alive = 'bg-surface/60 border-l-4 border-rose resonance-card-alive';
  const dimmed = 'bg-surface/30 border-l-4 border-rose/30';
  return `${base} ${faded ? dimmed : alive}`;
}

function CardLabel({ faded }: { faded?: boolean }) {
  return (
    <div className="flex items-center gap-sys-3 mb-sys-4">
      <CardGem faded={faded} />
      <span className="text-sys-micro uppercase tracking-sys-caption text-mist">
        {faded ? 'Faded' : 'Something that stayed with you'}
      </span>
    </div>
  );
}

function QuotedLine({ text }: { text: string }) {
  return (
    <p className="text-foreground/70 italic text-sys-body max-w-prose-sm mb-sys-4">
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

function ArticleMeta({ resonance, timeAgo }: { resonance: ResonanceWithArticle; timeAgo: string }) {
  return (
    <>
      <TextLink variant="inline" href={`/article/${resonance.articleId}`}
        className="text-sys-caption font-sys-accent">
        {resonance.articleTitle}
      </TextLink>
      <p className="text-mist/50 text-sys-micro mt-sys-1">{timeAgo}</p>
    </>
  );
}

function ClosingLine({ line }: { line: string }) {
  return (
    <p className="mt-sys-5 text-gold/50 italic text-sys-micro typo-caption">
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
 * The `→` glyph wears `.plate-caption-arrow` so the site-wide nudge rule
 * (`globals.css`, detached from `.plate-destination` per Mike #43 §6 +
 * Tanya UX §5) translates the arrow 2px right on `:focus-within`. The
 * launcher itself stays a ghost — no halo, no dwell, no elevation. Only
 * the glyph leans. `aria-hidden` keeps screen readers on the verb
 * ("Save as card"), not the ornament.
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
        Save as card <span aria-hidden="true" className="plate-caption-arrow">→</span>
      </Pressable>
    </div>
  );
}
