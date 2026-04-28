/**
 * PortalHero — cinematic article hero for the Threshold (homepage).
 *
 * Renders: title, metadata line, hairline, and up to two prose paragraphs.
 * Server component — receives article as prop, no hooks, no state.
 *
 * Typographic contract (Tanya §2):
 *   • zero markdown glyphs visible to the reader
 *   • paragraphs are split on `\n\n+` AFTER `stripMarkdownTokens`,
 *     so paired emphasis, links, headings, lists and quotes
 *     never leak through.
 *   • title-doppelgänger rule (Finding C): if the first stripped
 *     paragraph echoes the article title, drop it — the title
 *     already owns that line of meaning.
 *   • micro-paragraph preference (Finding D): prefer paragraphs
 *     ≥ MIN_PARAGRAPH_CHARS visible characters; fall back to
 *     whatever exists so the Threshold is never empty.
 *
 * Note: worldview badge intentionally omitted per UX spec.
 * The Threshold should feel like opening a book, not browsing a catalog.
 */

import type { Article } from '@/lib/content/ContentTagger';
import { estimateReadingTime } from '@/lib/content/ContentTagger';
import { stripMarkdownTokens, collapseWhitespace } from '@/lib/content/excerpt';
import { formatReadingTime } from '@/lib/utils/reading-time';
import { CaptionMetric } from '@/components/shared/CaptionMetric';
import { wrapClassOf, hyphensClassOf, hangPunctClassOf } from '@/lib/design/typography';

/* ─── Wrap policy — `passage` break on the threshold excerpt (Tanya UX #85 §3) ─
   The hero's prose paragraphs ride `thermal-typography` (the marquee
   surface's line-height + font-weight + halo). The static `typo-passage`
   beat carries leading + tracking; `wrapClassOf('passage')` adds the
   wrap-only break policy (`text-wrap: pretty`) so a final word never
   strands at 320 px. The literal `typo-wrap-passage` lives in
   `wrapClassOf` only; pinned by
   `lib/design/__tests__/passage-wrap-converges.fence.test.ts`.
   The h1 above is `display` beat — `wrap: balance` — out of scope
   this slot (Mike #26 §3, "do not graze it now"). */
const PASSAGE_WRAP = wrapClassOf('passage');

/* ─── Hyphens policy — `passage` widow killer at 320 px (Tanya UX §3.3) ────
   Sibling handle to `PASSAGE_WRAP` — wrap and hyphens are disjoint
   properties, so this composes as a silent addition on the threshold
   excerpt. The h1 above is `display` beat (`wrap: balance`) and is
   intentionally NOT hyphenated — display beats break by silhouette, not
   by syllable (Tanya UX §4 carve-out). Lang-bound — pinned by
   `html-lang-required-for-hyphenation.fence.test.ts`. The literal
   `typo-hyphens-passage` lives in `hyphensClassOf` only; pinned by
   `lib/design/__tests__/passage-hyphens-converges.fence.test.ts`. */
const PASSAGE_HYPHENS = hyphensClassOf('passage');

/* ─── Hang policy — `passage` optical edge polish (Tanya UX §2.1) ──────────
   Sibling handle to `PASSAGE_WRAP` + `PASSAGE_HYPHENS` — wrap, hyphens,
   and hang declare disjoint CSS properties, so this composes as a silent
   addition on the threshold excerpt. Center-axis hero paragraphs land
   tighter on Safari: opening quotes hang into the left gutter, trailing
   periods into the right margin. The h1 above is `display` beat
   (`wrap: balance`) and is intentionally NOT hung — display beats break
   by silhouette, and hang fights the silhouette (Tanya UX §2.1 carve-
   out). Safari-only paint surface; Chrome / Firefox / Edge see today's
   column unchanged. The class literal `typo-hang-passage` lives in
   `hangPunctClassOf` only; pinned by
   `lib/design/__tests__/passage-hang-converges.fence.test.ts`. */
const PASSAGE_HANG = hangPunctClassOf('passage');

// ─── Helpers ──────────────────────────────────────────────

/** Soft floor for "looks like prose, not a list-stub" (Tanya §3.2 D). */
const MIN_PARAGRAPH_CHARS = 40;
const MAX_HERO_PARAGRAPHS = 2;

/** Paragraph-honest projection: strip first, split second, collapse third. */
function paragraphsFrom(content: string): string[] {
  return stripMarkdownTokens(content)
    .split(/\n\n+/)
    .map(collapseWhitespace)
    .filter(Boolean);
}

/** Drop the leading paragraph if it echoes the article title (Finding C). */
function dropTitleEcho(paragraphs: string[], title: string): string[] {
  if (paragraphs.length === 0) return paragraphs;
  const norm = (s: string) => collapseWhitespace(s).toLowerCase();
  return norm(paragraphs[0]) === norm(title) ? paragraphs.slice(1) : paragraphs;
}

/** Prefer prose paragraphs over list-stub stutter (Finding D). */
function preferProse(paragraphs: string[]): string[] {
  const long = paragraphs.filter(p => p.length >= MIN_PARAGRAPH_CHARS);
  return long.length ? long : paragraphs;
}

/** Pure: raw article → up to two display-ready paragraphs. */
function heroParagraphs(article: Article): string[] {
  const all = paragraphsFrom(article.content);
  const trimmed = dropTitleEcho(all, article.title);
  return preferProse(trimmed).slice(0, MAX_HERO_PARAGRAPHS);
}

// ─── Component ────────────────────────────────────────────

export default function PortalHero({ article }: { article: Article }) {
  const readTime = estimateReadingTime(article.content);
  const excerpts = heroParagraphs(article);

  return (
    <div className="text-center max-w-2xl mx-auto animate-fade-in thermal-space">
      <h1 className="text-sys-h1 text-foreground tracking-sys-display thermal-typography">
        {article.title}
      </h1>

      {/* Duration label — the publisher's promise. Snaps to the standard
          caption-metric face via `<CaptionMetric>` (Mike #38) — alpha-
          ledger `quiet` rung, `tracking-sys-caption`, `tabular-nums`. The
          string itself flows from the substrate `formatReadingTime` so
          paper, hero, card, and caption all wear one voice. */}
      <CaptionMetric size="caption" className="mt-sys-4">
        {formatReadingTime(readTime)}
      </CaptionMetric>

      <div className="border-t border-fog mt-sys-8 mb-sys-8 mx-auto max-w-xs" />

      {excerpts.map((para, i) => (
        <p key={i} className={`text-foreground/70 text-sys-lg
          typo-passage ${PASSAGE_WRAP} ${PASSAGE_HYPHENS} ${PASSAGE_HANG} mb-sys-4 max-w-xl mx-auto thermal-typography`}>
          {para}
        </p>
      ))}
    </div>
  );
}

/** Test seam — pure helpers. Component tests stay rendering-only. */
export const __testing__ = {
  paragraphsFrom,
  dropTitleEcho,
  preferProse,
  heroParagraphs,
  MIN_PARAGRAPH_CHARS,
  MAX_HERO_PARAGRAPHS,
};
