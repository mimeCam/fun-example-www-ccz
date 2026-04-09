'use client';

import { Article } from '@/lib/content/ContentTagger';
import ExploreArticleCard from '@/components/explore/ExploreArticleCard';

interface Props {
  articles: Article[];
}

export default function ArticlesPageClient({ articles }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <header className="mb-10">
        <h1 className="font-display text-foreground text-2xl md:text-3xl font-bold">
          Articles
        </h1>
        <p className="text-mist text-sm italic mt-1">
          Writing that pays attention back.
        </p>
      </header>

      {/* Article grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map(article => (
          <ExploreArticleCard
            key={article.id}
            article={article}
            showWorldview
          />
        ))}
      </div>

      {/* Article count */}
      <p className="text-mist/40 text-xs mt-8">
        {articles.length} {articles.length === 1 ? 'article' : 'articles'}
      </p>
    </div>
  );
}
