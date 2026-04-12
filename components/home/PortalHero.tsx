/**
 * PortalHero — cinematic article hero for the Threshold (homepage).
 *
 * Renders: title, metadata line, and a compelling excerpt.
 * Server component — receives article as prop, no hooks, no state.
 * Uses design system tokens: sys-* for typography, thermal-typography for warmth.
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
    <div className="text-center max-w-2xl mx-auto animate-fade-in thermal-space">
      <h1 className="text-sys-h1 text-foreground tracking-tight thermal-typography">
        {article.title}
      </h1>

      <p className="text-mist text-sys-caption mt-sys-4 tracking-wide">
        {readTime} min read
      </p>

      <div className="border-t border-fog mt-sys-8 mb-sys-8 mx-auto max-w-xs" />

      {excerpts.map((para, i) => (
        <p key={i} className="text-foreground/80 text-sys-lg
          leading-relaxed mb-sys-4 max-w-xl mx-auto thermal-typography">
          {para}
        </p>
      ))}
    </div>
  );
}
