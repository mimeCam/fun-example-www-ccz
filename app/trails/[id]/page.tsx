/**
 * Trail Detail Page
 *
 * Shows a complete trail with articles and connection reasoning
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GemHome } from '@/components/navigation/GemHome';
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
      <div className="min-h-screen p-8 bg-background">
        <GemHome />
        <p className="text-mist">Loading trail...</p>
      </div>
    );
  }

  if (!trail) {
    return (
      <div className="min-h-screen p-8 bg-background">
        <GemHome />
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-[#f0f0f5] mb-4">Trail Not Found</h1>
          <p className="text-mist mb-8">
            The trail you&apos;re looking for doesn&apos;t exist or hasn&apos;t been created yet.
          </p>
          <Link href="/trails" className="text-accent hover:text-primary transition-colors text-sm">
            Browse all trails
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <GemHome />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-[#f0f0f5]">{trail.name}</h1>
          <p className="text-[#f0f0f5]/80 text-lg mb-4">{trail.description}</p>

          <div className="flex items-center gap-4 text-sm text-mist">
            <span>{trail.estimatedTime}</span>
            <span>{trail.articleIds.length} articles</span>
            <span className="px-2 py-1 bg-primary/20 text-[#f0f0f5]/80 text-xs rounded-md">
              {trail.metadata.category}
            </span>
          </div>
        </div>

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
                <ArticleCard article={article} index={index} />
                {connection && <ConnectionCard connection={connection} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ArticleCard({ article, index }: { article: any; index: number }) {
  return (
    <div className="bg-surface rounded-xl p-6 border-l-4 border-primary shadow-void">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
          {index + 1}
        </div>

        <div className="flex-1">
          <Link
            href={`/article/${article.id}`}
            className="text-xl font-semibold text-[#f0f0f5] hover:text-[#f0f0f5]/80 transition-colors"
          >
            {article.title}
          </Link>

          {article.tags && article.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {article.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-fog text-[#f0f0f5]/80 text-xs rounded-md"
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

function ConnectionCard({ connection }: { connection: TrailConnection }) {
  return (
    <div className="my-4 ml-14 p-4 bg-gradient-to-r from-cyan/10 to-primary/10 rounded-xl border border-cyan/40 shadow-void">
      <div className="flex items-start gap-3">
        <svg
          className="w-6 h-6 text-cyan flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>

        <div>
          <h4 className="text-sm font-semibold text-cyan/80 mb-2">
            Why this order
          </h4>
          <p className="text-[#f0f0f5]/80 text-sm italic">
            &ldquo;{connection.reason}&rdquo;
          </p>
          <ConnectionTypeBadge type={connection.connectionType} />
        </div>
      </div>
    </div>
  );
}

function ConnectionTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    foundational: 'bg-cyan/10 text-cyan/80 border-cyan/40',
    extension: 'bg-cyan/10 text-cyan/80 border-cyan/40',
    practical: 'text-gold bg-gold/10 border-gold/40',
    alternative: 'text-gold bg-gold/10 border-gold/40',
    related: 'bg-primary/10 text-accent border-primary/40',
  };

  const labels: Record<string, string> = {
    foundational: 'Foundation',
    extension: 'Deep Dive',
    practical: 'Application',
    alternative: 'Perspective',
    related: 'Related',
  };

  return (
    <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-md border ${colors[type] || colors.related}`}>
      {labels[type] || 'Related'}
    </span>
  );
}
