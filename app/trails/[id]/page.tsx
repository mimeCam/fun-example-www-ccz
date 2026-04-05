/**
 * Trail Detail Page
 *
 * Shows a complete trail with articles and connection reasoning
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { TrailWithArticles, TrailConnection } from '@/types/trail';

export default function TrailDetailPage({ params }: { params: { id: string } }) {
  const [trail, setTrail] = useState<TrailWithArticles | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrail() {
      try {
        const response = await fetch(`/api/trails?id=${params.id}&populate=true`);
        if (response.ok) {
          const data = await response.json();
          setTrail(data);
        }
      } catch (error) {
        console.error('Error loading trail:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTrail();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-900 text-white">
        <p>Loading trail...</p>
      </div>
    );
  }

  if (!trail) {
    return (
      <div className="min-h-screen p-8 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Trail Not Found</h1>
          <p className="text-gray-400 mb-8">
            The trail you're looking for doesn't exist or hasn't been created yet.
          </p>
          <Link
            href="/trails"
            className="text-purple-400 hover:text-purple-300"
          >
            ← Back to all trails
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/trails"
            className="text-purple-400 hover:text-purple-300 text-sm mb-4 inline-block"
          >
            ← Back to all trails
          </Link>
          <h1 className="text-4xl font-bold mb-4">{trail.name}</h1>
          <p className="text-gray-300 text-lg mb-4">{trail.description}</p>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>⏱️ {trail.estimatedTime}</span>
            <span>📚 {trail.articleIds.length} articles</span>
            <span className="px-2 py-1 bg-purple-800/50 text-purple-200 text-xs rounded">
              {trail.metadata.category}
            </span>
          </div>
        </div>

        {/* TODO: Add progress tracking for logged-in users */}
        {/* TODO: Add trail start/continue functionality */}

        {/* Articles with connections */}
        <div className="space-y-6">
          {trail.articles.map((article, index) => {
            const nextArticle = trail.articles[index + 1];
            const connection = nextArticle
              ? trail.connections.find(
                  c => c.fromArticleId === article.id && c.toArticleId === nextArticle.id
                )
              : null;

            return (
              <div key={article.id}>
                {/* Article Card */}
                <ArticleCard article={article} index={index} />

                {/* Connection between articles */}
                {connection && (
                  <ConnectionCard connection={connection} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Article Card Component
 */
function ArticleCard({ article, index }: { article: any; index: number }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border-l-4 border-purple-500">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
          {index + 1}
        </div>

        <div className="flex-1">
          <Link
            href={`/article/${article.id}`}
            className="text-xl font-semibold text-purple-100 hover:text-purple-200"
          >
            {article.title}
          </Link>

          {article.tags && article.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {article.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Connection Card Component - Shows "Why this order"
 */
function ConnectionCard({ connection }: { connection: TrailConnection }) {
  return (
    <div className="my-4 ml-14 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-700/50">
      <div className="flex items-start gap-3">
        <svg
          className="w-6 h-6 text-blue-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>

        <div>
          <h4 className="text-sm font-semibold text-blue-300 mb-2">
            Why this order
          </h4>
          <p className="text-gray-300 text-sm italic">
            "{connection.reason}"
          </p>
          <ConnectionTypeBadge type={connection.connectionType} />
        </div>
      </div>
    </div>
  );
}

/**
 * Connection Type Badge Component
 */
function ConnectionTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    foundational: 'bg-blue-900/50 text-blue-300 border-blue-700',
    extension: 'bg-green-900/50 text-green-300 border-green-700',
    practical: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
    alternative: 'bg-orange-900/50 text-orange-300 border-orange-700',
    related: 'bg-purple-900/50 text-purple-300 border-purple-700',
  };

  const labels: Record<string, string> = {
    foundational: 'Foundation',
    extension: 'Deep Dive',
    practical: 'Application',
    alternative: 'Perspective',
    related: 'Related',
  };

  return (
    <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded border ${colors[type] || colors.related}`}>
      {labels[type] || 'Related'}
    </span>
  );
}
