/**
 * ReadProgressCaption — the Sundial Caption.
 *
 * The small line beneath the article H1 ("`5 min read`" today)
 * graduates into a three-state, scroll-driven label that breathes with
 * the reader's body, never with a clock:
 *
 *   state 0 · publisher's promise   `5 min read`
 *   state 1 · reader's presence     `~3 min left`
 *   state 2 · reader's testimony    `read`
 *
 * The whole feature is `formatReadProgress(readTime, maxDepth, isComplete)`
 * — a pure helper in `lib/utils/read-progress.ts`. This component is the
 * thinnest possible adapter: it pulls `maxDepth` from the existing
 * `<ScrollDepthProvider>` and `isComplete` from the existing
 * `useGenuineCompletion` one-shot hook, hands them to the resolver, and
 * paints the resulting string into one keyed `<span>`. The keyed re-mount
 * triggers the sealed `[data-sys-enter="fade"]` 120ms crossfade in
 * `app/globals.css`. No new motion token. No `<motion.span>`. No Framer.
 * No RAF. No clock.
 *
 * SSR parity (load-bearing — Tanya #77 §7, Mike #43 §10):
 *   First paint must be byte-identical to today's `{readTime} min read`.
 *   The component computes state 0 synchronously on the server (and on
 *   the first client render) by reading `maxDepth = 0`, `isComplete =
 *   false` from the default context value. No `useEffect`-then-`setState`
 *   hand-off, no flash-of-wrong-content.
 *
 * a11y posture (decided, not waved past — Tanya #77 §5):
 *   `aria-live="off"`. The static promise (`5 min read`) is the AT
 *   announcement once at SSR. States 1 and 2 are visual-only — letting
 *   a screen reader announce "approximately three minutes left" mid-read
 *   would be exactly the nagging the Sundial Invariant exists to prevent.
 *   Reader-invariant per AGENTS.md: clarify, do not warm.
 *
 * Print posture (Tanya #77 §6):
 *   Paper has no scroll position. Under `@media print` the component
 *   forces state 0 by rendering two spans — one `.screen-only` carrying
 *   the live state, one `.print-only` carrying the static promise. The
 *   classes are owned by `lib/design/print-surface.css`.
 *
 * Slot stability (Tanya #77 §3):
 *   The inner span carries `min-width: 14ch` so the centered slot does
 *   not waltz horizontally during the crossfade between
 *   `5 min read` (~10ch) → `~3 min left` (~12ch) → `read` (~4ch).
 *   `font-variant-numeric: tabular-nums` keeps "5" and "3" in the same
 *   digit slot under the dissolve. Both are font-feature settings on the
 *   existing `caption` typography beat — no new ledger entries.
 *
 * Credits: Mike K. (#43 napkin — helper signature, two-file diff,
 * SSR-parity guard, no-`<motion.span>` rule), Tanya D. (#77 — three-state
 * UX spec, the `min-width: 14ch` slot stabilizer, the tabular-nums call,
 * the `aria-live="off"` a11y posture, the print carve-out shape),
 * Krystle C. (referenced — three-state scope, no-new-ledger discipline),
 * Elon M. (referenced — pure-function framing, fast-flick determinism
 * test that informed the keyed re-mount), Paul K. (referenced — the
 * "caption must never move unless the reader moves" structural rule).
 */

'use client';

import {
  formatReadProgress,
  normalizeDepth,
  readProgressKey,
  type ReadProgressKey,
} from '@/lib/utils/read-progress';
import { formatReadingTime } from '@/lib/utils/reading-time';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';
import { useGenuineCompletion } from '@/lib/hooks/useGenuineCompletion';
import { SKELETON_ENTER_ATTR } from '@/lib/design/skeleton';
import { CaptionMetric } from '@/components/shared/CaptionMetric';

// ─── Public API — one prop, sealed ───────────────────────────────────────

export interface ReadProgressCaptionProps {
  /**
   * The publisher's estimate, in whole minutes. Same value already
   * computed at the article-page level via `estimateReadingTime` and
   * passed into `useGenuineCompletion`.
   */
  readTime: number;
}

// ─── Constants — exported for the test, not for callers ──────────────────

/**
 * Centered captions waltz under center-alignment when their character
 * count changes mid-fade. 14ch holds the slot wide enough for the
 * longest of the three states (`~3 min left`, ~12ch) plus a hair.
 * (Tanya #77 §3 layout.)
 */
export const CAPTION_MIN_WIDTH_CH = 14;

// ─── Component — sealed, one resolver call, one keyed span ───────────────

/**
 * Renders the screen-side live caption and a print-only static fallback.
 * The screen-side span re-mounts on state change, which triggers the
 * sealed 120ms crossfade. The print-only span never moves.
 */
export function ReadProgressCaption({
  readTime,
}: ReadProgressCaptionProps): JSX.Element {
  const { maxDepth } = useScrollDepth();
  const { isComplete } = useGenuineCompletion(readTime);
  const depth = normalizeDepth(maxDepth);
  const text = formatReadProgress(readTime, depth, isComplete);
  const stateKey = readProgressKey(depth, isComplete);
  return (
    <>
      <ScreenCaption text={text} stateKey={stateKey} />
      <PrintCaption readTime={readTime} />
    </>
  );
}

// ─── Sub-components — each ≤ 10 LOC ──────────────────────────────────────

/**
 * Screen-side caption. Re-keyed on state to trigger the sealed
 * `[data-sys-enter="fade"]` crossfade. `aria-live="off"`; the static
 * promise is the AT announcement.
 */
function ScreenCaption({
  text,
  stateKey,
}: {
  text: string;
  stateKey: ReadProgressKey;
}): JSX.Element {
  return (
    <span aria-live="off" className="screen-only" style={SCREEN_WRAPPER_STYLE}>
      <span key={stateKey} {...ENTER_FADE_PROPS} style={SCREEN_INNER_STYLE}>
        {text}
      </span>
    </span>
  );
}

/**
 * Print-side caption. Always state 0. Reader-invariant on paper because
 * paper has no scroll position; states 1 and 2 would be incoherent. The
 * string flows from the substrate `formatReadingTime` so paper and
 * screen wear the same edge cases (Mike #35 §5 #5 — print parity is a
 * deliverable). Snaps to the standard caption-metric face via
 * `<CaptionMetric as="span">` (Mike #38) so the digit metric, caption-
 * voice and `quiet` rung match the hero, mirror MetaLine and explore
 * card — one face for every metric surface (Tanya §4c).
 */
function PrintCaption({ readTime }: { readTime: number }): JSX.Element {
  return (
    <CaptionMetric as="span" className="print-only">
      {formatReadingTime(readTime)}
    </CaptionMetric>
  );
}

// ─── Style atoms — pinned, hoisted, no per-render allocation ─────────────

/** Wrapper style on the screen-side span. Inline-block so min-width takes effect. */
const SCREEN_WRAPPER_STYLE: React.CSSProperties = {
  display: 'inline-block',
  minWidth: `${CAPTION_MIN_WIDTH_CH}ch`,
  fontVariantNumeric: 'tabular-nums',
};

/** Inner style on the keyed span. The element the keyframe animates. */
const SCREEN_INNER_STYLE: React.CSSProperties = {
  display: 'inline-block',
};

/**
 * The single CSS hook that runs the 120ms keyed-mount crossfade. Spread
 * onto the inner span so re-mounts (state changes) fire the sealed
 * `MOTION.crossfade × ALPHA.muted → 1` keyframe in `app/globals.css`.
 */
const ENTER_FADE_PROPS = {
  [SKELETON_ENTER_ATTR.name]: SKELETON_ENTER_ATTR.value,
} as const;

// ─── Internal handle for the test suite (no public re-export) ────────────

export const __testing__ = {
  CAPTION_MIN_WIDTH_CH,
  ENTER_FADE_PROPS,
} as const;
