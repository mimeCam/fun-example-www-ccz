'use client';

import { Article } from '@/lib/content/ContentTagger';
import ExploreArticleCard from './ExploreArticleCard';

interface AllArticlesGridProps {
  articles: Article[];
}

export default function AllArticlesGrid({ articles }: AllArticlesGridProps) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-display text-foreground text-xl font-semibold">
          All Articles
        </h2>
        <div className="flex-1 h-px bg-fog/40" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <ExploreArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
