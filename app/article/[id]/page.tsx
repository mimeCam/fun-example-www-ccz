'use client';

import { useMemo, useEffect, useRef } from 'react';
import { notFound } from 'next/navigation';
import { GoldenThread } from '@/components/reading/GoldenThread';
import { GemHome } from '@/components/navigation/GemHome';
import { ResonanceButton } from '@/components/resonances/ResonanceButton';
import { SelectionPopover } from '@/components/resonances/SelectionPopover';
import { StratifiedRenderer } from '@/components/content/StratifiedRenderer';
import { NextRead } from '@/components/reading/NextRead';
import { CompletionShimmer } from '@/components/reading/CompletionShimmer';
import { CeremonySequencer } from '@/components/reading/CeremonySequencer';
import { bestRecommendation } from '@/lib/content/archetype-recommendations';
import { ScrollDepthProvider } from '@/lib/hooks/useScrollDepth';
import { useStratifiedContent } from '@/lib/hooks/useStratifiedContent';
import { useMirror } from '@/lib/hooks/useMirror';
import { useResonanceMarginalia, extractCoreParagraphs } from '@/lib/hooks/useResonanceMarginalia';
import { useReturnRecognition } from '@/lib/hooks/useReturnRecognition';
import { useEntranceChoreography } from '@/lib/hooks/useEntranceChoreography';
import type { EntranceStep } from '@/lib/hooks/useEntranceChoreography';
import { getLayeredContent, getArticleById, getAllArticles } from '@/lib/content/articleData';
import { estimateReadingTime } from '@/lib/content/ContentTagger';
import type { ArchetypeKey } from '@/types/content';
import type { ContentBlock } from '@/lib/content/content-layers';
import WhisperFooter from '@/components/shared/WhisperFooter';
import { ThermalProvider, useThermal } from '@/components/thermal/ThermalProvider';
import { accumulateArticle, saveHistory, loadHistory } from '@/lib/thermal/thermal-history';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';
import { useGenuineCompletion } from '@/lib/hooks/useGenuineCompletion';

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

  const { mirror } = useMirror();
  const history = useMemo(() => loadHistory(), []);
  const readCount = history.articleIds.length;

  // Archetype from mirror only — QuickMirror removed from reading flow.
  // Identity revelation belongs on /mirror, not mid-article.
  const archetype = (mirror?.archetype as ArchetypeKey) ?? null;

  const stratifiedBlocks = useStratifiedContent(params.id, layeredContent, archetype, readCount);

  const coreParagraphs = useMemo(
    () => extractCoreParagraphs(stratifiedBlocks),
    [stratifiedBlocks]
  );
  const resonanceBlocks = useResonanceMarginalia(params.id, coreParagraphs);

  const mergedBlocks = useMemo(() => {
    if (!resonanceBlocks.length) return stratifiedBlocks;
    return insertResonanceBlocks(stratifiedBlocks, resonanceBlocks, coreParagraphs);
  }, [stratifiedBlocks, resonanceBlocks, coreParagraphs]);

  const recognition = useReturnRecognition();
  const entrance = useEntranceChoreography();

  const { refresh: refreshThermal } = useThermal();
  const completion = useGenuineCompletion(readTime);

  const { maxDepth } = useScrollDepth();
  const startTime = useRef(Date.now());
  const maxDepthRef = useRef(maxDepth);
  maxDepthRef.current = maxDepth;

  // Accumulate reading session into thermal history on unmount
  useEffect(() => {
    return () => {
      const dwell = (Date.now() - startTime.current) / 1000;
      const h = accumulateArticle(loadHistory(), params.id, maxDepthRef.current, dwell);
      saveHistory(h);
    };
  }, [params.id]);

  const allArticles = getAllArticles().filter(a => a.id !== params.id);
  const readArticleIds = history.articleIds;
  const recommendation = bestRecommendation(article, allArticles, archetype, readArticleIds);

  return (
    <CeremonySequencer
      triggered={completion.isComplete}
      confidence={completion.confidence}
      onRefresh={refreshThermal}
    >
      <GoldenThread />
      <GemHome quiet />
      {/* Selection popover — gem blooms above highlighted text (pointer devices only) */}
      <SelectionPopover articleId={params.id} articleTitle={article.title} />
      <article className="min-h-screen">
        <div className="max-w-prose mx-auto px-sys-7">
          <div className={entrance.disabled ? '' : 'entrance-fade-up'} style={entranceStyle(entrance.topbar)}>
            <TopBar articleId={params.id} title={article.title} />
          </div>
          <div className={entrance.disabled ? '' : 'entrance-fade-up'} style={entranceStyle(entrance.header)}>
            <ArticleHeader title={article.title} readTime={readTime} />
          </div>
          <hr
            className={`border-gold/10 mb-sys-8 origin-center${entrance.disabled ? '' : ' entrance-divider-draw'}`}
            style={entranceStyle(entrance.divider)}
          />

          <div
            className={`prose prose-invert max-w-none mb-sys-10 text-[length:var(--sys-text-prose)] thermal-typography text-foreground${entrance.disabled ? '' : ' entrance-fade-up'}`}
            style={entranceStyle(entrance.prose)}
          >
            {mergedBlocks.length > 0 ? (
              <StratifiedRenderer blocks={mergedBlocks} archetype={archetype} articleId={params.id} warmer={recognition.isReturning} />
            ) : (
              <p className="text-mist">Article content not available.</p>
            )}
          </div>

          <CompletionShimmer />
          {recommendation && (
            <NextRead
              article={recommendation.article}
              context={recommendation.reason}
              archetype={archetype}
            />
          )}
        </div>
        <WhisperFooter />
      </article>
    </CeremonySequencer>
  );
}

/** Build inline style dict for entrance CSS custom properties. */
function entranceStyle(step: EntranceStep): React.CSSProperties {
  if (step.duration === 0) return {};
  return {
    '--entrance-delay': `${step.delay}ms`,
    '--entrance-duration': `${step.duration}ms`,
  } as React.CSSProperties;
}

function TopBar({ articleId, title }: { articleId: string; title: string }) {
  return (
    <div className="flex items-center justify-end pt-sys-7 pb-sys-3">
      <ResonanceButton articleId={articleId} articleTitle={title} />
    </div>
  );
}

function ArticleHeader({ title, readTime }: { title: string; readTime: number }) {
  return (
    <header className="mb-sys-8 text-center">
      <h1 className="font-display text-sys-h2 font-sys-display text-foreground typo-display">
        {title}
      </h1>
      <p className="text-mist text-sys-caption mt-sys-3">{readTime} min read</p>
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
