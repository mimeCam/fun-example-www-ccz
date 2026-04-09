/**
 * NextRead - Context-Aware "Next Read" Recommendation
 *
 * Design Philosophy (from Tanya Donska's UX spec):
 * - Shows ONE recommendation, not a grid
 * - Includes context about WHY this article was recommended
 * - Clean, focused layout with subtle styling
 * - Non-intrusive, gentle emergence
 *
 * Placement: Bottom of article, after conclusion, before footer
 */

'use client';

import { Article } from '@/lib/content/ContentTagger';
import Link from 'next/link';

interface NextReadProps {
  article: Article;
  context: string;
}

/**
 * Context-Aware "Next Read" Component
 *
 * Shows a single, intelligent recommendation with context
 */
export function NextRead({ article, context }: NextReadProps) {
  if (!article) {
    return null;
  }

  return (
    <div className="my-12 p-8 rounded-2xl relative overflow-hidden transition-all duration-600 ease-out animate-fade-in">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      {/* Top border only */}
      <div className="absolute top-0 left-0 right-0 h-px bg-primary opacity-15" />

      {/* Content */}
      <div className="relative z-10">
        {/* "UP NEXT" label */}
        <div className="mb-4">
          <span className="text-xs tracking-widest uppercase opacity-50 font-medium">
            Up Next
          </span>
          <div className="w-16 h-0.5 bg-primary mt-2" />
        </div>

        {/* Article title */}
        <h3 className="text-2xl font-semibold text-white mb-3 leading-tight">
          {article.title}
        </h3>

        {/* Context - WHY this article was recommended */}
        <p className="text-sm text-mist mb-6 leading-relaxed opacity-70">
          {context}
        </p>

        {/* CTA Button */}
        <Link
          href={`/article/${article.id}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all duration-200 font-medium text-sm"
          style={{
            boxShadow: '0 4px 24px rgba(123, 44, 191, 0.06)',
          }}
        >
          Read this next
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

/**
 * Generate context for why an article was recommended
 * In production, this would use more sophisticated algorithms
 */
export function generateRecommendationContext(
  currentArticle: Article,
  recommendedArticle: Article
): string {
  // Find common tags
  const commonTags = currentArticle.tags?.filter(tag =>
    recommendedArticle.tags?.includes(tag)
  ) || [];

  if (commonTags.length > 0) {
    const topic = commonTags[0].replace(/-/g, ' ');
    return `You just read about ${topic}. Here's another perspective that builds on that foundation.`;
  }

  // Fallback contexts based on content analysis
  const contexts = [
    "You've just explored a complex idea. Here's what happened when someone put it into practice.",
    "This article challenges similar assumptions. Ready for another perspective?",
    "Based on your reading pattern, this might spark your next insight.",
    "You're diving deep into this topic. Here's a complementary angle worth exploring.",
  ];

  return contexts[Math.floor(Math.random() * contexts.length)];
}
