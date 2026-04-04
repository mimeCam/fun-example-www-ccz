/**
 * RelatedPosts - Content discovery component
 * Design philosophy: Subtle, helpful, zero friction
 * Follows Tanya's recommendation: clean card, no popups
 * Now includes Editor's Picks - author-curated recommendations
 */

'use client';

import { Article } from '@/lib/content/ContentTagger';
import { estimateReadingTime } from '@/lib/content/ContentTagger';
import Link from 'next/link';
import { RelatedPostWithSource } from '@/lib/content/related-posts';

interface RelatedPostsProps {
  relatedPosts: RelatedPostWithSource[];
  currentArticleId: string;
}

/**
 * Related posts card component
 * Displays related articles with editor picks distinguished
 */
export function RelatedPosts({ relatedPosts, currentArticleId }: RelatedPostsProps) {
  if (relatedPosts.length === 0) {
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
        {relatedPosts.map((relatedPost) => (
          <RelatedPostCard
            key={relatedPost.article.id}
            article={relatedPost.article}
            isEditorPick={relatedPost.source === 'editor'}
            reason={relatedPost.reason}
          />
        ))}
      </div>
    </div>
  );
}

interface RelatedPostCardProps {
  article: Article;
  isEditorPick?: boolean;
  reason?: string;
}

/**
 * Individual related post card
 * Shows editor pick badge when applicable
 */
function RelatedPostCard({ article, isEditorPick, reason }: RelatedPostCardProps) {
  const readTime = estimateReadingTime(article.content);

  return (
    <Link
      href={`/article/${article.id}`}
      className="block p-4 bg-gray-800 rounded border border-gray-700 hover:border-primary transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-lg font-medium text-white hover:text-primary transition-colors">
          {article.title}
        </h4>

        {/* Editor's Pick Badge */}
        {isEditorPick && (
          <span className="flex-shrink-0 px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded border border-primary/30">
            Editor's Pick
          </span>
        )}
      </div>

      {/* Author's reason for editor picks */}
      {reason && (
        <p className="text-sm text-gray-400 mb-3 italic">
          "{reason}"
        </p>
      )}

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
