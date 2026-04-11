/**
 * PortalHero — cinematic article hero for the Threshold (homepage).
 *
 * Renders: title, metadata line, and a compelling excerpt.
 * Server component — receives article as prop, no hooks, no state.
 * Uses design tokens: gold for title accents, mist for metadata.
 *
 * Note: worldview badge intentionally omitted per UX spec.
 * The Threshold should feel like opening a book, not browsing a catalog.
 */

import type { Article } from '@/lib/content/ContentTagger';
import { estimateReadingTime } from '@/lib/content/ContentTagger';

// ─── Helpers ──────────────────────────────────────────────

function excerptParagraphs(content: string): string[] {
  return content.split(/\n\n+/).map(p => p.trim()).filter(Boolean).slice(0, 2);
}

// ─── Component ────────────────────────────────────────────

export default function PortalHero({ article }: { article: Article }) {
  const readTime = estimateReadingTime(article.content);
  const excerpts = excerptParagraphs(article.content);

  return (
    <div className="text-center max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold
        text-foreground leading-tight tracking-tight thermal-typography">
        {article.title}
      </h1>

      <p className="text-mist text-sm mt-4 tracking-wide">
        {readTime} min read
      </p>

      <div className="border-t border-fog mt-8 mb-8 mx-auto max-w-xs" />

      {excerpts.map((para, i) => (
        <p key={i} className="text-foreground/80 text-lg md:text-xl
          leading-relaxed mb-4 max-w-xl mx-auto font-light">
          {para}
        </p>
      ))}
    </div>
  );
}
