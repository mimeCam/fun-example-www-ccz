'use client';

import { useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { GoldenThread } from '@/components/reading/GoldenThread';
import { StateCrossingFlash } from '@/components/reading/StateCrossingFlash';
import { GemHome } from '@/components/navigation/GemHome';
import { ResonanceButton } from '@/components/resonances/ResonanceButton';
import { SelectionPopover } from '@/components/resonances/SelectionPopover';
import { StratifiedRenderer } from '@/components/content/StratifiedRenderer';
import { NextRead } from '@/components/reading/NextRead';
import { CompletionShimmer } from '@/components/reading/CompletionShimmer';
import { KeepsakePlate } from '@/components/reading/KeepsakePlate';
import { ReadersMark } from '@/components/reading/ReadersMark';
import { ArticleProvenance } from '@/components/reading/ArticleProvenance';
import { ReadProgressCaption } from '@/components/reading/ReadProgressCaption';
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
import { CollapsibleSlot } from '@/components/shared/CollapsibleSlot';
import { Divider } from '@/components/shared/Divider';
import { CHASSIS_SEAM_TOP_CLASS } from '@/lib/design/spacing';
import { wrapClassOf, hyphensClassOf } from '@/lib/design/typography';

// ─── Wrap policy — `passage` break, thermal rhythm (Tanya UX #85 §3) ──────
// The article body rides the `thermal-typography` carrier (line-height +
// font-weight + text-shadow + paragraph rhythm + print-pin). It carried no
// `text-wrap` policy, so 320 px columns stranded a final word per long
// paragraph. Compose `wrapClassOf('passage')` (wrap-only handle, `text-
// wrap: pretty`) onto the existing carrier — the breath stays; the widow
// goes. The literal `typo-wrap-passage` lives in `wrapClassOf` only;
// pinned by `lib/design/__tests__/passage-wrap-converges.fence.test.ts`.
const PASSAGE_WRAP = wrapClassOf('passage');

// ─── Hyphens policy — `passage` widow killer at 320 px (Tanya UX §3.1) ────
// Sibling handle to `PASSAGE_WRAP` — wrap and hyphens are disjoint
// properties, so this composes as a silent addition. Adds `hyphens: auto`
// + `hyphenate-limit-chars: 8 4 4` + `overflow-wrap: break-word` so long
// words like *"extraordinarily"* break with a polite hyphen at narrow
// viewports instead of stranding against the right edge of the column.
// Lang-bound — requires `<html lang="en">` on the root document; pinned
// by `lib/design/__tests__/html-lang-required-for-hyphenation.fence.test.ts`.
// The literal `typo-hyphens-passage` lives in `hyphensClassOf` only;
// pinned by `lib/design/__tests__/passage-hyphens-converges.fence.test.ts`.
const PASSAGE_HYPHENS = hyphensClassOf('passage');

// Recognition-surface portal — gated by the shared selector so the
// Whisper and the home-rail Letter can never paint at the same time
// (Mike §5, Tanya §2). Dynamic + ssr:false mirrors `ReturningPortal`.
const ArticleWhisperPortal = dynamic(
  () => import('@/components/return/ArticleWhisperPortal'),
  { ssr: false },
);
import { ThermalProvider, useThermal } from '@/components/thermal/ThermalProvider';
import { accumulateArticle, saveHistory, loadHistory } from '@/lib/thermal/thermal-history';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';
import { useGenuineCompletion } from '@/lib/hooks/useGenuineCompletion';
import { useLoopFunnel } from '@/lib/hooks/useLoopFunnel';
import { useStateCrossing } from '@/lib/hooks/useStateCrossing';

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

  const { refresh: refreshThermal, state: thermalState } = useThermal();

  // Emit crossing events when thermal state advances mid-reading.
  // Skips the first delta (page-load restore guard — see useStateCrossing).
  useStateCrossing(thermalState);
  const completion = useGenuineCompletion(readTime);

  // Reader Loop Funnel — registers article id + archetype so any
  // emitter (mirror, thread depth, keepsake, clipboard) can fire a
  // session checkpoint without threading params down. Invisible to
  // the reader; one row per session in `loop_funnel`. (Mike §6.)
  useLoopFunnel(params.id, archetype);

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
      <StateCrossingFlash />
      <GemHome quiet />
      {/* Selection popover — gem blooms above highlighted text (pointer devices only) */}
      <SelectionPopover articleId={params.id} articleTitle={article.title} />
      <article id="main-content" className="min-h-screen">
        {/* T1 chassis seam — Mike #4 napkin §4 (wrap-and-strip). The
            article-detail T1 is from nav-bottom to ArticleHeader's h1
            cap-height, NOT to TopBar's resonance-button row. The seam
            container owns the breath; TopBar's old `pt-sys-7` collapses
            to utility rhythm (`pb-sys-3` only). T3 is owned by the
            universal `WhisperFooter` (Mike #4 §3 — footer is the single
            T3 site), so this file does not pad bottom-side. */}
        <div className={`max-w-prose mx-auto px-sys-7 ${CHASSIS_SEAM_TOP_CLASS}`}>
          {/* Paper-only greeting bow — hidden on screen, lands inline at the
              top of the printed page. Pairs with ReadersMark (parting bow)
              to bracket the printed article. Tanya UX #8 §3, Mike #20 §3. */}
          <ArticleProvenance article={article} />
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
            className={`prose prose-invert max-w-none mb-sys-10 text-[length:var(--sys-text-prose)] thermal-typography ${PASSAGE_WRAP} ${PASSAGE_HYPHENS} text-foreground${entrance.disabled ? '' : ' entrance-fade-up'}`}
            style={entranceStyle(entrance.prose)}
          >
            {mergedBlocks.length > 0 ? (
              <StratifiedRenderer blocks={mergedBlocks} archetype={archetype} articleId={params.id} warmer={recognition.isReturning} />
            ) : (
              <p className="text-mist">Article content not available.</p>
            )}
          </div>

          <CompletionShimmer />
          {/* Coda act 1 — the Plate: a live preview of the reader's own
              keepsake. Mounts only when the ceremony reaches `gifting`
              (KeepsakePlate guards internally). The page's only solid
              CTA at completion. Tanya UX #74 §2.1, Mike #41 §1. */}
          <KeepsakePlate articleId={params.id} title={article.title} />
          {recommendation && (
            <NextRead
              article={recommendation.article}
              context={recommendation.reason}
              archetype={archetype}
            />
          )}
          {/* Paper-only colophon — hidden on screen, lands inline on the
              printed page when the reader's maxDepth ≥ 10%. Tanya UX #13 §5. */}
          <ReadersMark />

          {/* Coda — recognition Whisper for returning readers, gated by
              the shared selector. Tanya §2 — "the comma in the right
              margin." Sits below NextRead, above the coda hairline.
              ──
              `CollapsibleSlot` owns the breathing room (mt-sys-10 /
              mb-sys-8) so the gap survives the stranger branch where
              the inner returns `null`. The envelope SSRs even though
              the portal itself is `dynamic({ ssr: false })` — that is
              the SSR pin (Krystle, Tanya #3 §4). Strangers and
              returners produce identical surrounding-DOM rhythm; only
              the italic line paints differently. Mike #2 §5 — margins
              for a collapsible portal live on the portal's envelope,
              not on its siblings. */}
          <CollapsibleSlot top={10} bottom={8}>
            <ArticleWhisperPortal />
          </CollapsibleSlot>

          {/* Coda hairline — geometric divider between the article body
              (and its quiet Whisper) and site chrome (the WhisperFooter).
              Migrated from a raw `<hr>` to the `<Divider.Static />`
              kernel (Tanya UX §4.4 ratifies the divider sprint as a UX
              requirement, not just a token-discipline ticket). The
              kernel owns gold/10, max-w-divider, rounded-full, and the
              symmetric breath rung. The envelope above (`CollapsibleSlot`)
              still owns the asymmetric coda breath — this sibling does
              not compensate for the portal's render verdict. */}
          <Divider.Static spacing="sys-7" />
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
  // Wrap-and-strip — the chassis seam container above owns the T1 breath.
  // TopBar's old `pt-sys-7` would double-pad against `CHASSIS_SEAM_TOP_CLASS`;
  // its `pb-sys-3` stays as intra-cluster rhythm to ArticleHeader (Mike #4
  // napkin §POI 2 — not chassis seam, utility row spacing).
  return (
    <div className="flex items-center justify-end pb-sys-3">
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
      <p className="text-mist text-sys-caption mt-sys-3">
        <ReadProgressCaption readTime={readTime} />
      </p>
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
