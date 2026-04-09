/**
 * /articles — Worldview-filtered article listing.
 *
 * Server Component. Reads ?type= from searchParams, filters by worldview.
 * Invalid type values fall through to show all articles (no 404).
 */

import { Metadata } from 'next';
import { getAllArticles } from '@/lib/content/articleData';
import { FilterType, FILTER_TEMPLATES } from '@/types/filter';
import { GemHome } from '@/components/navigation/GemHome';
import WhisperFooter from '@/components/shared/WhisperFooter';
import ArticlesPageClient from '@/components/articles/ArticlesPageClient';

const VALID_TYPES = new Set<string>(['technical', 'philosophical', 'practical', 'contrarian']);

function toFilterType(raw: string | string[] | undefined): FilterType | null {
  if (!raw || Array.isArray(raw)) return null;
  return VALID_TYPES.has(raw) ? (raw as FilterType) : null;
}

export function generateMetadata({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): Metadata {
  const type = toFilterType(searchParams.type);
  if (!type) return { title: 'Articles', description: 'Browse all articles' };
  const tpl = FILTER_TEMPLATES[type];
  return { title: `${tpl.title} — Articles`, description: tpl.description };
}

export default function ArticlesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const type = toFilterType(searchParams.type);
  const all = getAllArticles();
  const articles = type ? all.filter(a => a.worldview === type) : all;

  return (
    <main className="min-h-screen bg-gradient-to-r from-background via-background to-surface/10">
      <GemHome />
      <ArticlesPageClient articles={articles} activeFilter={type} />
      <WhisperFooter />
    </main>
  );
}
