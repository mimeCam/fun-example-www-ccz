/**
 * /articles — Article listing.
 *
 * Server Component. Shows all articles in a clean grid.
 * Curated row for returning readers with detected archetype.
 */

import { Metadata } from 'next';
import { getAllArticles } from '@/lib/content/articleData';
import { GemHome } from '@/components/navigation/GemHome';
import WhisperFooter from '@/components/shared/WhisperFooter';
import ArticlesPageClient from '@/components/articles/ArticlesPageClient';
import { SuspenseFade } from '@/components/shared/SuspenseFade';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Writing that pays attention back.',
};

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <main className="min-h-screen bg-background">
      <GemHome />
      {/* In-page boundary: route-level loading.tsx already covers the cold
          fallback (its Skeleton wears the same breath cadence). The fade
          is for the moment ArticlesPageClient hydrates over that surface
          — soft handoff, no scene cut. fallback={null} because the route
          fallback is already painting; double-painting a skeleton here
          would polyrhythm the breath. */}
      <SuspenseFade fallback={null}>
        <ArticlesPageClient articles={articles} />
      </SuspenseFade>
      <WhisperFooter />
    </main>
  );
}
