/**
 * Article Card with Journey Context - Example usage
 *
 * Demonstrates how to display journey context on article cards.
 * Shows minimal badge (depth + primary tag) with hover state for full context.
 *
 */

import type { JourneyContext } from '@/types/journey-context';
import { JourneyContextBadge } from './JourneyContextBadge';

interface ArticleCardProps {
  id: string;
  title: string;
  excerpt: string;
  journeyContext: JourneyContext;
  onClick?: () => void;
}

/**
 * Article card with journey context badge
 *
 * Displays minimal context indicator in card metadata.
 * Follows Tanya's "ambient signal" design principle.
 */
export function ArticleCard({
  id,
  title,
  excerpt,
  journeyContext,
  onClick,
}: ArticleCardProps) {
  return (
    <article
      className="bg-surface border border-surface hover:border-primary rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-primary/20 cursor-pointer"
      onClick={onClick}
    >
      {/* Journey context badge - minimal mode */}
      <div className="mb-3">
        <JourneyContextBadge
          context={journeyContext}
          mode="minimal"
          size="sm"
        />
      </div>

      {/* Article title */}
      <h3 className="text-xl font-bold text-white mb-2 hover:text-accent transition-colors">
        {title}
      </h3>

      {/* Article excerpt */}
      <p className="text-gray-400 text-sm mb-4 line-clamp-3">
        {excerpt}
      </p>

      {/* Reading metadata */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>5 min read</span>
        <span>·</span>
        <span>Published today</span>
      </div>
    </article>
  );
}

/**
 * Example usage of ArticleCard with JourneyContext
 *
 * ```tsx
 * import { ArticleCard } from '@/components/journey/ArticleCard';
 * import { calculateJourneyContext } from '@/lib/content/JourneyContext';
 *
 * const articleContent = "Your article content here...";
 * const journeyContext = calculateJourneyContext(articleContent);
 *
 * <ArticleCard
 *   id="1"
 *   title="The Art of Challenging Ideas"
 *   excerpt="Learn how to question assumptions constructively..."
 *   journeyContext={journeyContext}
 *   onClick={() => router.push(`/article/1`)}
 * />
 * ```
 */
