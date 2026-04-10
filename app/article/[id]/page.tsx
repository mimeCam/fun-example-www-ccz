'use client';

import { useMemo } from 'react';
import { notFound } from 'next/navigation';
import { DepthBar } from '@/components/reading/DepthBar';
import { GemHome } from '@/components/navigation/GemHome';
import { ResonanceButton } from '@/components/resonances/ResonanceButton';
import QuickMirrorCard from '@/components/mirror/QuickMirrorCard';
import { StratifiedRenderer } from '@/components/content/StratifiedRenderer';
import { NextRead } from '@/components/reading/NextRead';
import { bestRecommendation } from '@/lib/content/archetype-recommendations';
import MirrorWhisper from '@/components/reading/MirrorWhisper';
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
import WhisperFooter from '@/components/shared/WhisperFooter';

export default function ArticlePage({ params }: { params: { id: string } }) {
  return (
    <ScrollDepthProvider>
      <ArticleContent params={params} />
    </ScrollDepthProvider>
  );
}

function ArticleContent({ params }: { params: { id: string } }) {
  const article = getArticleById(params.id);
  if (!article) notFound();

  const layeredContent = getLayeredContent(params.id);
  const readTime = estimateReadingTime(article.content);
  const topics = article.tags ?? [];

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

  // When QuickMirror triggers, inject the card at the ~30% position in the content
  // so it appears between paragraphs, not appended after all prose.
  const { displayBlocks, hasInlineMirror } = useMemo(() => {
    if (!quickMirror.triggered || !quickMirror.result) {
      return { displayBlocks: mergedBlocks, hasInlineMirror: false };
    }
    // Find the insertion point: after the core block at ~30% of total core blocks
    const coreCount = mergedBlocks.filter(b => b.layer === 'core').length;
    const targetIdx = Math.max(1, Math.floor(coreCount * 0.3));
    let coreSeen = 0;
    let insertAt = -1;

    for (let i = 0; i < mergedBlocks.length; i++) {
      if (mergedBlocks[i].layer === 'core') {
        coreSeen++;
        if (coreSeen >= targetIdx) { insertAt = i + 1; break; }
      }
    }
    if (insertAt < 0) return { displayBlocks: mergedBlocks, hasInlineMirror: false };

    const mirrorBlock: ContentBlock = {
      layer: 'quick-mirror',
      paragraphs: [],
      isNew: false,
    };
    const out = [...mergedBlocks];
    out.splice(insertAt, 0, mirrorBlock);
    return { displayBlocks: out, hasInlineMirror: true };
  }, [mergedBlocks, quickMirror.triggered, quickMirror.result]);

  // Return recognition — ambient "I know you" for returning readers
  const recognition = useReturnRecognition();

  // Archetype-aware next read recommendation
  const allArticles = getAllArticles().filter(a => a.id !== params.id);
  const readArticleIds = typeof window !== 'undefined'
    ? Object.keys(JSON.parse(localStorage.getItem('reading_memory') || '{}'))
    : [];
  const recommendation = bestRecommendation(article, allArticles, archetype, readArticleIds);

  return (
    <>
      <DepthBar />
      <GemHome />
      <article className="min-h-screen">
        <div className="max-w-[38rem] mx-auto px-6">
          <TopBar articleId={params.id} title={article.title} />
          <ArticleHeader title={article.title} readTime={readTime} />
          <RecognitionWhisper recognition={recognition} />
          <hr className="border-fog mb-8" />

          <div className="prose prose-invert max-w-none mb-12 text-[1.0625rem] leading-[1.8] text-white">
            {displayBlocks.length > 0 ? (
              <StratifiedRenderer blocks={displayBlocks} archetype={archetype} articleId={params.id} warmer={recognition.isReturning}
                mirrorSlot={quickMirror.triggered && quickMirror.result ? (
                  <div className="my-16">
                    <QuickMirrorCard result={quickMirror.result} articleId={params.id} />
                  </div>
                ) : undefined}
              />
            ) : (
              <p className="text-mist">Article content not available.</p>
            )}
          </div>

          {quickMirror.triggered && quickMirror.result && !hasInlineMirror && (
            <div className="my-16">
              <QuickMirrorCard
                result={quickMirror.result}
                articleId={params.id}
              />
            </div>
          )}

          <MirrorWhisper archetype={archetype} />

          <hr className="border-fog my-12" />
          {recommendation && (
            <NextRead
              article={recommendation.article}
              context={recommendation.reason}
              archetype={archetype}
            />
          )}

          <WhisperFooter />
        </div>
      </article>
    </>
  );
}

function TopBar({ articleId, title }: { articleId: string; title: string }) {
  return (
    <div className="flex items-center justify-end pt-8 pb-4">
      <ResonanceButton articleId={articleId} articleTitle={title} />
    </div>
  );
}

function ArticleHeader({ title, readTime }: { title: string; readTime: number }) {
  return (
    <header className="mb-8 text-center">
      <h1 className="font-display text-[2.25rem] font-bold text-white leading-tight tracking-tight">
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
