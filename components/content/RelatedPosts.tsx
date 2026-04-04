/**
 * RelatedPosts - Content discovery component
 * Design philosophy: Subtle, helpful, zero friction
 * Follows Tanya's recommendation: clean card, no popups
 */

'use client';

import { Article } from '@/lib/content/ContentTagger';
import { estimateReadingTime } from '@/lib/content/ContentTagger';
import Link from 'next/link';

interface RelatedPostsProps {
  articles: Article[];
  currentArticleId: string;
}

/**
 * Related posts card component
 * Displays related articles based on content similarity
 */
export function RelatedPosts({ articles, currentArticleId }: RelatedPostsProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 p-6 bg-gray-900 rounded-lg border border-gray-800">
      <h3 className="text-xl font-semibold text-primary mb-4">
        Continue Exploring
      </h3>
      <p className="text-sm text-gray-400 mb-6">
        Discover more articles on similar topics
      </p>

      <div className="space-y-4">
        {articles.map((article) => (
          <RelatedPostCard
            key={article.id}
            article={article}
          />
        ))}
      </div>
    </div>
  );
}

interface RelatedPostCardProps {
  article: Article;
}

/**
 * Individual related post card
 */
function RelatedPostCard({ article }: RelatedPostCardProps) {
  const readTime = estimateReadingTime(article.content);

  return (
    <Link
      href={`/article/${article.id}`}
      className="block p-4 bg-gray-800 rounded border border-gray-700 hover:border-primary transition-colors"
    >
      <h4 className="text-lg font-medium text-white mb-2 hover:text-primary transition-colors">
        {article.title}
      </h4>

      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
        {article.content.slice(0, 150)}...
      </p>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>{readTime} min read</span>

        {article.tags && article.tags.length > 0 && (
          <>
            <span>•</span>
            <div className="flex gap-2">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-700 rounded text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
