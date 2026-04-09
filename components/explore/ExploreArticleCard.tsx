'use client';

import Link from 'next/link';
import { Article } from '@/lib/content/ContentTagger';
import { estimateReadingTime } from '@/lib/content/ContentTagger';

interface ExploreArticleCardProps {
  article: Article;
  variant?: 'default' | 'curated';
  reason?: string;
}

export default function ExploreArticleCard({
  article,
  variant = 'default',
  reason,
}: ExploreArticleCardProps) {
  const minutes = estimateReadingTime(article.content);
  const excerpt = article.content.slice(0, 120).replace(/[#*_]/g, '').trim();
  const isCurated = variant === 'curated';

  return (
    <Link href={`/article/${article.id}`} className="block group">
      <article
        className={`bg-surface rounded-xl p-5 transition-all duration-200 h-full flex flex-col ${
          isCurated
            ? 'border border-gold/30 shadow-gold hover:shadow-gold-intense'
            : 'shadow-void hover:shadow-rise'
        }`}
      >
        <h3 className="font-display text-foreground font-bold text-lg mb-2 group-hover:text-gold transition-colors">
          {article.title}
        </h3>

        {reason && (
          <p className="text-gold/70 text-xs italic mb-2">{reason}</p>
        )}

        <p className="text-mist text-sm leading-relaxed mb-3 flex-1 line-clamp-3">
          {excerpt}…
        </p>

        <div className="flex items-center gap-2 text-xs text-mist/60">
          <span>{minutes} min read</span>
          {article.tags && article.tags.length > 0 && (
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
