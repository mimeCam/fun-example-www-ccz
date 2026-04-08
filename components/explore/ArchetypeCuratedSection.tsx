'use client';

import { Article } from '@/lib/content/ContentTagger';
import { ArchetypeKey } from '@/types/content';
import { getExtensionLabel } from '@/lib/content/content-layers';
import ExploreArticleCard from './ExploreArticleCard';

interface ArchetypeCuratedSectionProps {
  articles: Article[];
  archetype: ArchetypeKey;
}

function getAffinityScore(article: Article, archetype: ArchetypeKey): number {
  const hasQuestion = article.questions && article.questions.length > 0 ? 1 : 0;
  const tagCount = article.tags?.length ?? 0;
  return tagCount + hasQuestion * 2;
}

export default function ArchetypeCuratedSection({
  articles,
  archetype,
}: ArchetypeCuratedSectionProps) {
  const label = getExtensionLabel(archetype);

  const scored = articles
    .map((a) => ({ article: a, score: getAffinityScore(a, archetype) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-display text-gold text-xl font-semibold">
          {label}
        </h2>
        <div className="flex-1 h-px bg-gold/20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scored.map(({ article }) => (
          <ExploreArticleCard
            key={article.id}
            article={article}
            variant="curated"
            reason="Matches your reading pattern"
          />
        ))}
      </div>
    </section>
  );
}
