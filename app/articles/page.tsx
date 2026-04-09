/**
 * /articles — Unified article listing (no filter tabs).
 *
 * Server Component. Shows all articles in a clean grid.
 * Backward-compatible: ?type= still accepted but no longer used for filtering.
 */

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
    <main className="min-h-screen bg-gradient-to-r from-background via-background to-surface/10">
      <GemHome />
      <ArticlesPageClient articles={articles} />
      <WhisperFooter />
    </main>
  );
}
