/**
 * FeaturedArticle — client-side featured article selector.
 *
 * Strangers see the seed article. Returning readers see an unread article.
 * Falls back to random if everything has been read.
 */
'use client';

import { useState, useEffect } from 'react';
import { selectFeaturedArticle, readArticleIdsFromMemory } from '@/lib/content/featured';
import { getDefaultFeaturedArticle } from '@/lib/content/featured';
import PortalHero from './PortalHero';
import ReadingInvitation from './ReadingInvitation';
import type { Article } from '@/lib/content/ContentTagger';

interface Props {
  defaultArticle: Article;
}

export default function FeaturedArticle({ defaultArticle }: Props) {
  const [article, setArticle] = useState<Article>(defaultArticle);

  useEffect(() => {
    const readIds = readArticleIdsFromMemory();
    if (readIds.length > 0) {
      setArticle(selectFeaturedArticle(readIds));
    }
  }, []);

  return (
    <>
      <PortalHero article={article} />
      <ReadingInvitation articleId={article.id} />
    </>
  );
}
