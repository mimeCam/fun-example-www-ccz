/**
 * ReadersMark — the room's quiet bow on paper. End-of-article colophon
 * that lands inline at the article's end and surfaces ONLY in print.
 *
 * Why a colophon, not a margin line (Tanya UX #13 §5):
 *   - Inline content survives pagination — the mark always lands on the
 *     right page; an absolute `::before` would clip at page-1.
 *   - Glyph-based — the reader's printer paints characters in whatever
 *     ink mode they chose. No `print-color-adjust: exact`, no override
 *     of user agency.
 *   - Reader-invariant compliance — this is the *only* per-reader
 *     artifact on the printed page. It is deliberately scoped as
 *     reader-variant and lives here, NOT in `ambient-surfaces.css`.
 *     The `// reader-invariant` contract on ambient-surfaces stays clean.
 *
 * Geometry (Tanya §5.1):
 *   ───────────────────────────
 *       read to ▰▰▰▰▰▱▱▱▱▱
 *   ───────────────────────────
 *
 *   Hairlines above and below: 0.4pt #000.
 *   Mark glyph: ten Unicode block characters (U+25B0 / U+25B1).
 *   Caption: small caps, 8pt #555, "read to".
 *
 * Zero-depth case: if `maxDepth < 0.10`, render nothing. The reader who
 * hit ⌘P at zero scroll earned no mark, and the room is honest about
 * that (Paul/Tanya §5.1 — "no mark, the page is sterile").
 *
 * Hidden on screen, visible only in print: the wrapper carries the
 * `.print-only` class from `lib/design/print-surface.css`. All visual
 * styling (colors, hairlines, typography, spacing) lives in that
 * stylesheet too — the component carries structure and class hooks
 * only, no inline color/letter-spacing literals (color-adoption,
 * typography-adoption ledgers).
 *
 * Credits: Tanya D. (UX #13 §5 — colophon shape, glyph-not-line, hairline
 * geometry, zero-depth honesty), Mike K. (#24 — `.print-only` hook,
 * scoped-to-its-own-file pattern, classes-not-inline-styles refactor),
 * Elon M. (six-mode failure analysis → the colophon shape engineered
 * to dodge each), Paul K. (named the gap), Krystle C. (foundation-PR
 * doctrine).
 */
'use client';

import { useEffect, useState } from 'react';
import { peek, subscribe, type ThreadState } from '@/lib/thread/thread-driver';

/** Below this floor the page prints sterile (Tanya §5.1, Paul carry-through). */
const ZERO_DEPTH_FLOOR = 0.10;

/** Total glyphs in the mark. Renders as `▰▰▰▰▰▱▱▱▱▱` at 50% depth. */
const MARK_GLYPHS = 10;

/** Filled / empty block glyphs (U+25B0 / U+25B1). Inter ships both. */
const FILLED = '▰';
const EMPTY = '▱';

/**
 * Subscribe to the thread driver for live `maxDepth`. Pure hook, ≤10 LOC.
 * Initial value comes from a synchronous `peek()` so the colophon never
 * paints a stale 0 between hydration and first scroll tick.
 */
function useMaxDepth(): number {
  const [depth, setDepth] = useState<number>(() => peek().maxDepth);
  useEffect(() => subscribe((s: ThreadState) => setDepth(s.maxDepth)), []);
  return depth;
}

/** Build the glyph row for a 0..1 depth. Pure, deterministic, ≤10 LOC. */
function buildMark(maxDepth: number): string {
  const filled = Math.max(0, Math.min(MARK_GLYPHS, Math.round(maxDepth * MARK_GLYPHS)));
  return FILLED.repeat(filled) + EMPTY.repeat(MARK_GLYPHS - filled);
}

/** Hairline rule — geometry pinned in `print-surface.css` (.print-hairline,
 *  shared with ArticleProvenance so the printed page reads as bracketed
 *  by one hand at top and bottom — Tanya UX #8 §3.4). */
function HairlineRule() {
  return <hr aria-hidden="true" className="print-hairline" />;
}

/** The body of the colophon — caption + glyph row. Class hooks only. */
function MarkBody({ glyphs }: { glyphs: string }) {
  return (
    <div className="readers-mark-body">
      <span className="readers-mark-caption">read to</span>
      <span
        className="readers-mark-glyphs"
        aria-label={`reader's mark, ${glyphs.length} glyphs`}
      >
        {glyphs}
      </span>
    </div>
  );
}

/**
 * ReadersMark — paper-only colophon. Renders nothing on screen and
 * nothing in print when `maxDepth < ZERO_DEPTH_FLOOR`.
 *
 * The wrapper class `.print-only` (display:none unless @media print) and
 * `.readers-mark` (margin + break-inside:avoid) live in print-surface.css.
 * `data-readers-mark` is the component's stable hook for tests + future
 * consumers.
 */
export function ReadersMark() {
  const maxDepth = useMaxDepth();
  if (maxDepth < ZERO_DEPTH_FLOOR) return null;
  const glyphs = buildMark(maxDepth);
  return (
    <aside
      data-readers-mark
      className="print-only readers-mark"
      aria-hidden="true"
    >
      <HairlineRule />
      <MarkBody glyphs={glyphs} />
      <HairlineRule />
    </aside>
  );
}

/** Re-exported for tests and rare consumers that need to bypass the
 *  hook (e.g. a snapshot at a known maxDepth). Keeps the pure helper
 *  reachable without exposing the React hook surface. */
export const __testing__ = { buildMark, ZERO_DEPTH_FLOOR, MARK_GLYPHS };
