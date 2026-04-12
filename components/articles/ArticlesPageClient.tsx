/**
 * ArticlesPageClient — article listing with curated row for returning readers.
 *
 * Worldview filter chips removed: 6 articles don't need filtering.
 * Tags serve the same purpose. The curated row is the filter that matters.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Article } from '@/lib/content/ContentTagger';
import { ArchetypeKey } from '@/types/content';
import { getExtensionLabel } from '@/lib/content/content-layers';
import { useReturnRecognition } from '@/lib/hooks/useReturnRecognition';
import ExploreArticleCard from '@/components/explore/ExploreArticleCard';

// ─── Archetype affinity scoring ────────────────────────────

function getAffinityScore(article: Article, archetype: ArchetypeKey): number {
  const hasQ = article.questions?.length ? 1 : 0;
  return (article.tags?.length ?? 0) + hasQ * 2;
}

// ─── Component ─────────────────────────────────────────────

interface Props {
  articles: Article[];
}

export default function ArticlesPageClient({ articles }: Props) {
  const { archetype, recognitionTier } = useReturnRecognition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const showCurated = mounted && archetype && recognitionTier !== 'stranger';
  const curated = showCurated
    ? articles
        .map(a => ({ article: a, score: getAffinityScore(a, archetype!) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(x => x.article)
    : [];

  return (
    <div className="max-w-[48rem] mx-auto px-sys-7 py-sys-10">
      <header className="mb-sys-9">
        <h1 className="font-display text-foreground text-sys-h3 md:text-sys-h2 font-sys-display">
          Articles
        </h1>
        <p className="text-mist text-sys-caption italic mt-sys-1">
          Writing that pays attention back.
        </p>
      </header>

      {showCurated && (
        <CuratedRow curated={curated} archetype={archetype!} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-sys-7">
        {articles.map(article => (
          <ExploreArticleCard
            key={article.id}
            article={article}
          />
        ))}
      </div>
    </div>
  );
}

function CuratedRow({
  curated,
  archetype,
}: {
  curated: Article[];
  archetype: ArchetypeKey;
}) {
  return (
    <section className="mb-sys-10">
      <div className="flex items-center gap-sys-4 mb-sys-7">
        <h2 className="font-display text-gold text-sys-xl font-sys-heading">
          {getExtensionLabel(archetype)}
        </h2>
        <div className="flex-1 h-px bg-gold/20" />
      </div>
      <p className="text-mist/60 text-sys-micro mb-sys-5">Matches your reading pattern</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-sys-5">
        {curated.map(article => (
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
