/**
 * /articles — Unified article listing with worldview filtering.
 *
 * Server Component. Shows all articles in a clean grid.
 * Supports ?worldview= filter via URL search params.
 * Backward-compatible: ?type= still accepted.
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

export default function ArticlesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const articles = getAllArticles();
  const worldview = normalizeWorldview(searchParams.worldview ?? searchParams.type);

  return (
    <main className="min-h-screen bg-gradient-to-r from-background via-background to-surface/10">
      <GemHome />
      <Suspense>
        <ArticlesPageClient articles={articles} worldview={worldview} />
      </Suspense>
      <WhisperFooter />
    </main>
  );
}

function normalizeWorldview(raw: string | string[] | undefined): string | null {
  if (!raw || Array.isArray(raw)) return null;
  const valid = ['technical', 'philosophical', 'practical', 'contrarian'];
  return valid.includes(raw) ? raw : null;
}
