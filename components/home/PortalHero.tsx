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

      <p className="text-mist text-sys-caption mt-sys-4 tracking-sys-caption">
        {readTime} min read
      </p>

      <div className="border-t border-fog mt-sys-8 mb-sys-8 mx-auto max-w-xs" />

      {excerpts.map((para, i) => (
        <p key={i} className="text-foreground/80 text-sys-lg
          typo-passage mb-sys-4 max-w-xl mx-auto thermal-typography">
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
