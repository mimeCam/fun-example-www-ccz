'use client';

import { DepthBar } from '@/components/reading/DepthBar';
import { BookmarkButton } from '@/components/reading/BookmarkButton';
import QuickMirrorCard from '@/components/mirror/QuickMirrorCard';
import { StratifiedRenderer } from '@/components/content/StratifiedRenderer';
import { ContentLock } from '@/components/content/ContentLock';
import { NextRead, generateRecommendationContext } from '@/components/reading/NextRead';
import { useStratifiedContent } from '@/lib/hooks/useStratifiedContent';
import { useMirror } from '@/lib/hooks/useMirror';
import { useQuickMirror } from '@/lib/hooks/useQuickMirror';
import { getLayeredContent } from '@/lib/content/articleData';
import { resolveLockedLayers } from '@/lib/content/content-layers';
import { getArticleById, getAllArticles } from '@/lib/content/articleData';
import type { ArchetypeKey } from '@/types/content';

export default function ArticlePage({ params }: { params: { id: string } }) {
  const article = getArticleById(params.id);
  const layeredContent = getLayeredContent(params.id);

  // Mirror archetype — drives stratified content visibility
  const { mirror } = useMirror();
  const archetype = (mirror?.archetype as ArchetypeKey) ?? null;
  const readCount = typeof window !== 'undefined'
    ? Object.keys(JSON.parse(localStorage.getItem('reading_memory') || '{}')).length
    : 0;

  // Stratified content: resolve visible layers
  const stratifiedBlocks = useStratifiedContent(params.id, layeredContent, archetype, readCount);

  // Quick Mirror — archetype synthesis at 70% scroll
  const quickMirror = useQuickMirror(params.id, 5, ['critical-thinking'], 70);

  // Content Lock — hidden layers the reader hasn't unlocked
  const lockedLayers = layeredContent
    ? resolveLockedLayers(layeredContent, archetype, readCount)
    : [];

  // Next read recommendation — single article
  const allArticles = getAllArticles().filter(a => a.id !== params.id);
  const nextArticle = allArticles[0];
  const nextContext = nextArticle
    ? generateRecommendationContext(
        { id: params.id, title: article?.title ?? '', content: '', tags: [] },
        nextArticle
      )
    : '';

  return (
    <>
      <DepthBar articleId={params.id} />

      <article className="min-h-screen">
        <div className="max-w-[38rem] mx-auto px-6">
          {/* Minimal top bar */}
          <div className="flex items-center justify-between pt-8 pb-4">
            <a href="/" className="text-mist text-sm hover:text-primary transition-colors">
              &larr; Back
            </a>
            <BookmarkButton articleId={params.id} articleTitle={article?.title ?? ''} />
          </div>

          {/* Title + metadata */}
          <header className="mb-8 text-center">
            <h1 className="font-display text-[2.25rem] font-bold text-[#f0f0f5] leading-tight tracking-tight">
              {article?.title ?? 'Article'}
            </h1>
            <p className="text-mist text-sm mt-3">
              Author &middot; 5 min read
            </p>
          </header>

          {/* Divider */}
          <hr className="border-fog mb-8" />

          {/* Article body — stratified content or fallback */}
          <div className="prose prose-invert max-w-none mb-12 text-[1.0625rem] leading-[1.8] text-[#f0f0f5]">
            {stratifiedBlocks.length > 0 ? (
              <StratifiedRenderer blocks={stratifiedBlocks} archetype={archetype} />
            ) : (
              <p className="text-mist">Article content not available.</p>
            )}
          </div>

          {/* ContentLock — shimmer blocks for hidden layers */}
          <ContentLock lockedLayers={lockedLayers} />

          {/* Quick Mirror — cinematic archetype reveal */}
          {quickMirror.triggered && quickMirror.result && (
            <QuickMirrorCard
              result={quickMirror.result}
              articleUrl={typeof window !== 'undefined' ? window.location.href : undefined}
            />
          )}

          {/* Divider */}
          <hr className="border-fog my-12" />

          {/* Next Read — single recommendation */}
          {nextArticle && (
            <NextRead article={nextArticle} context={nextContext} />
          )}

          {/* Footer */}
          <footer className="text-center py-12 text-mist text-sm">
            <p className="mb-2">No algorithms. No feeds.</p>
            <div className="flex justify-center gap-6">
              <a href="/mirror" className="text-primary hover:text-secondary transition-colors">Mirror</a>
              <a href="/about" className="text-primary hover:text-secondary transition-colors">About</a>
            </div>
          </footer>
        </div>
      </article>
    </>
  );
}
