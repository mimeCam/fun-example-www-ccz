'use client';

import type React from 'react';
import Link from 'next/link';
import { Article } from '@/lib/content/ContentTagger';
import { estimateReadingTime } from '@/lib/content/ContentTagger';
import { useScrollRise } from '@/lib/hooks/useScrollRise';

interface ExploreArticleCardProps {
  article: Article;
  /** Position in section — drives scroll-rise stagger delay. */
  index?: number;
  variant?: 'default' | 'curated';
  /** Kept for backward compatibility — CuratedRow no longer passes this. */
  reason?: string;
  showWorldview?: boolean;
}

const WORLDVIEW_COLORS: Record<string, string> = {
  technical:     'bg-primary/20 text-accent',
  philosophical: 'bg-primary/20 text-primary',
  practical:     'bg-cyan/20 text-cyan',
  contrarian:    'bg-rose/20 text-rose',
};

export default function ExploreArticleCard({
  article,
  index = 0,
  variant = 'default',
  reason,
  showWorldview = false,
}: ExploreArticleCardProps) {
  const minutes  = estimateReadingTime(article.content);
  const excerpt  = article.content.slice(0, 120).replace(/[#*_]/g, '').trim();
  const isCurated = variant === 'curated';

  const { ref } = useScrollRise({ index });

  return (
    <Link
      ref={ref as React.RefObject<HTMLAnchorElement>}
      href={`/article/${article.id}`}
      className="block group thermal-radius"
    >
      {/* `thermal-radius` on the anchor itself — so the global :focus-visible
          ring inherits the same curve the inner article surface declares.
          Without it, keyboard-focus would paint a 0-radius box around a
          rounded card. (Honoring-ring audit — Tanya #93 §4, Mike napkin §4.3.)

          `ref` feeds useScrollRise — the hook sets `data-sys-rise="pre"` on
          mount (card invisible) then `data-sys-enter="rise"` on intersection
          (card animates in with stagger). One observer for the whole list. */}
      <article
        className={`bg-surface thermal-radius shadow-sys-rest p-sys-6 h-full flex flex-col
          card-alive ${
          isCurated
            ? 'border border-gold/20 hover:border-gold/50 card-alive-curated'
            : 'border border-fog/15 hover:border-fog/40'
        }`}
      >
        {/* Tanya §2.4: cards are surfaces, not buttons. Rest → sys-rest
            (grid visibly quieter); hover lift is owned by .card-alive in
            globals.css, so no hover shadow class is needed here. */}
        <h3 className="font-display text-foreground font-sys-display text-sys-lg mb-sys-3 group-hover:text-gold transition-colors">
          {article.title}
        </h3>

        {reason && (
          <p className="text-gold/70 text-sys-micro italic mb-sys-3">{reason}</p>
        )}

        <p className="text-mist text-sys-caption typo-caption mb-sys-4 flex-1 line-clamp-3">
          {excerpt}…
        </p>

        <div className="flex items-center gap-sys-3 text-sys-micro text-mist/60">
          <span>{minutes} min read</span>
          {showWorldview && article.worldview && (
            <>
              <span className="text-mist/30">·</span>
              <span className={`px-sys-2 py-sys-1 rounded-sys-soft text-sys-micro font-sys-accent ${WORLDVIEW_COLORS[article.worldview] ?? 'bg-fog/20 text-mist'}`}>
                {article.worldview}
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
