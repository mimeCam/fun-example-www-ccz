'use client';

import Link from 'next/link';
import { Article } from '@/lib/content/ContentTagger';
import { estimateReadingTime } from '@/lib/content/ContentTagger';

interface ExploreArticleCardProps {
  article: Article;
  variant?: 'default' | 'curated';
  reason?: string;
  showWorldview?: boolean;
}

const WORLDVIEW_COLORS: Record<string, string> = {
  technical: 'bg-primary/20 text-accent',
  philosophical: 'bg-purple-500/20 text-purple-300',
  practical: 'bg-cyan-500/20 text-cyan-300',
  contrarian: 'bg-rose-500/20 text-rose-300',
};

export default function ExploreArticleCard({
  article,
  variant = 'default',
  reason,
  showWorldview = false,
}: ExploreArticleCardProps) {
  const minutes = estimateReadingTime(article.content);
  const excerpt = article.content.slice(0, 120).replace(/[#*_]/g, '').trim();
  const isCurated = variant === 'curated';

  return (
    <Link href={`/article/${article.id}`} className="block group">
      <article
        className={`bg-surface rounded-lg p-5 transition-all duration-hover h-full flex flex-col group-hover:-translate-y-px ${
          isCurated
            ? 'border border-gold/30 shadow-gold hover:shadow-gold-intense'
            : 'border border-fog/10 shadow-void hover:shadow-rise'
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
          {showWorldview && article.worldview && (
            <>
              <span className="text-mist/30">·</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium ${WORLDVIEW_COLORS[article.worldview] ?? 'bg-fog/20 text-mist'}`}>
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
