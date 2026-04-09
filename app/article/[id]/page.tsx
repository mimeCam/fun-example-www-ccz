'use client';

import { useMemo } from 'react';
import { DepthBar } from '@/components/reading/DepthBar';
import { ResonanceButton } from '@/components/resonances/ResonanceButton';
import QuickMirrorCard from '@/components/mirror/QuickMirrorCard';
import { StratifiedRenderer } from '@/components/content/StratifiedRenderer';
import { NextRead, generateRecommendationContext } from '@/components/reading/NextRead';
import { ScrollDepthProvider } from '@/lib/hooks/useScrollDepth';
import { useStratifiedContent } from '@/lib/hooks/useStratifiedContent';
import { useMirror } from '@/lib/hooks/useMirror';
import { useQuickMirror } from '@/lib/hooks/useQuickMirror';
import { useResonanceMarginalia, extractCoreParagraphs } from '@/lib/hooks/useResonanceMarginalia';
import { useReturnRecognition } from '@/lib/hooks/useReturnRecognition';
import { getLayeredContent, getArticleById, getAllArticles } from '@/lib/content/articleData';
import { estimateReadingTime } from '@/lib/content/ContentTagger';
import type { ArchetypeKey } from '@/types/content';
import type { ContentBlock } from '@/lib/content/content-layers';
import { RecognitionWhisper } from '@/components/return/RecognitionWhisper';

export default function ArticlePage({ params }: { params: { id: string } }) {
  return (
    <ScrollDepthProvider>
      <ArticleContent params={params} />
    </ScrollDepthProvider>
  );
}

function ArticleContent({ params }: { params: { id: string } }) {
  const article = getArticleById(params.id);
  const layeredContent = getLayeredContent(params.id);
  const readTime = article ? estimateReadingTime(article.content) : 5;
  const topics = article?.tags ?? [];

  const { mirror } = useMirror();
  const readCount = typeof window !== 'undefined'
    ? Object.keys(JSON.parse(localStorage.getItem('reading_memory') || '{}')).length
    : 0;

  // Quick Mirror fires at 30% scroll — archetype from behavioral signals
  const quickMirror = useQuickMirror(params.id, readTime, topics);

  // Use QuickMirror archetype (localStorage-persisted, refreshed on detection)
  // Falls back to email-based mirror archetype for returning readers
  const archetype = (quickMirror.result?.archetype as ArchetypeKey)
    ?? (mirror?.archetype as ArchetypeKey)
    ?? null;

  // Stratified content: resolve visible layers with paragraph variants
  const stratifiedBlocks = useStratifiedContent(params.id, layeredContent, archetype, readCount);

  // Resonance marginalia: fetch reader's resonances for this article
  const coreParagraphs = useMemo(
    () => extractCoreParagraphs(stratifiedBlocks),
    [stratifiedBlocks]
  );
  const resonanceBlocks = useResonanceMarginalia(params.id, coreParagraphs);

  // Merge resonance blocks into stratified content
  const mergedBlocks = useMemo(() => {
    if (!resonanceBlocks.length) return stratifiedBlocks;
    return insertResonanceBlocks(stratifiedBlocks, resonanceBlocks, coreParagraphs);
  }, [stratifiedBlocks, resonanceBlocks, coreParagraphs]);

  // Return recognition — ambient "I know you" for returning readers
  const recognition = useReturnRecognition();

  // Next read recommendation
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
      <DepthBar />
      <article className="min-h-screen">
        <div className="max-w-[38rem] mx-auto px-6">
          <TopBar articleId={params.id} title={article?.title ?? ''} />
          <ArticleHeader title={article?.title ?? 'Article'} readTime={readTime} />
          <RecognitionWhisper recognition={recognition} />
          <hr className="border-fog mb-8" />

          <div className="prose prose-invert max-w-none mb-12 text-[1.0625rem] leading-[1.8] text-[#f0f0f5]">
            {mergedBlocks.length > 0 ? (
              <StratifiedRenderer blocks={mergedBlocks} archetype={archetype} articleId={params.id} warmer={recognition.isReturning} />
            ) : (
              <p className="text-mist">Article content not available.</p>
            )}
          </div>

          {quickMirror.triggered && quickMirror.result && (
            <div className="my-16">
              <QuickMirrorCard
                result={quickMirror.result}
                articleId={params.id}
              />
            </div>
          )}

          <hr className="border-fog my-12" />
          {nextArticle && <NextRead article={nextArticle} context={nextContext} />}

          <footer className="text-center py-12 text-mist text-sm">
            <p className="mb-2">No algorithms. No feeds.</p>
            <div className="flex justify-center gap-6">
              <a href="/mirror" className="text-primary hover:text-secondary transition-colors">Mirror</a>
              <a href="/explore" className="text-primary hover:text-secondary transition-colors">Explore</a>
            </div>
          </footer>
        </div>
      </article>
    </>
  );
}

function TopBar({ articleId, title }: { articleId: string; title: string }) {
  return (
    <div className="flex items-center justify-between pt-8 pb-4">
      <a href="/" className="text-mist text-sm hover:text-primary transition-colors">
        &larr; Back
      </a>
      <ResonanceButton articleId={articleId} articleTitle={title} />
    </div>
  );
}

function ArticleHeader({ title, readTime }: { title: string; readTime: number }) {
  return (
    <header className="mb-8 text-center">
      <h1 className="font-display text-[2.25rem] font-bold text-[#f0f0f5] leading-tight tracking-tight">
        {title}
      </h1>
      <p className="text-mist text-sm mt-3">Author &middot; {readTime} min read</p>
    </header>
  );
}

/** Insert resonance marginalia blocks after the matching core paragraph */
function insertResonanceBlocks(
  base: ContentBlock[],
  resonance: ContentBlock[],
  paragraphs: string[]
): ContentBlock[] {
  const result: ContentBlock[] = [];
  let pIdx = 0;

  for (const block of base) {
    result.push(block);
    if (block.layer !== 'core') continue;

    for (let i = 0; i < block.paragraphs.length; i++) {
      for (const rb of resonance) {
        if (rb.resonance && paragraphs[pIdx + i]?.includes(rb.resonance.quote)) {
          result.push({ ...rb, isNew: true });
        }
      }
    }
    pIdx += block.paragraphs.length;
  }

  // Fallback: if no paragraph matched, append at the end
  const inserted = result.filter(b => b.layer === 'resonance-marginalia');
  if (inserted.length < resonance.length) {
    const unmatched = resonance.filter(
      rb => !inserted.some(ib => ib.resonance?.id === rb.resonance?.id)
    );
    result.push(...unmatched);
  }

  return result;
}
