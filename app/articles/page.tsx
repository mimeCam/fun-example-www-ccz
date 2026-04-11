/**
 * /articles — Article listing.
 *
 * Server Component. Shows all articles in a clean grid.
 * Curated row for returning readers with detected archetype.
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { getAllArticles } from '@/lib/content/articleData';
import { GemHome } from '@/components/navigation/GemHome';
import WhisperFooter from '@/components/shared/WhisperFooter';
import ArticlesPageClient from '@/components/articles/ArticlesPageClient';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Writing that pays attention back.',
};

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <main className="min-h-screen bg-background">
      <GemHome />
      <Suspense>
        <ArticlesPageClient articles={articles} />
      </Suspense>
      <WhisperFooter />
    </main>
  );
}
