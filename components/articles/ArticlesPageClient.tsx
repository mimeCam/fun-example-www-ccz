/**
 * ArticlesPageClient — article listing with curated row for returning readers.
 *
 * Worldview filter chips removed: 6 articles don't need filtering.
 * Tags serve the same purpose. The curated row is the filter that matters.
 *
 * Scroll-rise: each ExploreArticleCard receives its section index so the
 * useScrollRise hook can stagger the card entrance wave correctly.
 * Curated and main-grid cards use independent stagger clocks (index resets
 * to 0 at the start of each section).
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Article } from '@/lib/content/ContentTagger';
import { ArchetypeKey } from '@/types/content';
import { getExtensionLabel } from '@/lib/content/content-layers';
import { useReturnRecognition } from '@/lib/hooks/useReturnRecognition';
import ExploreArticleCard from '@/components/explore/ExploreArticleCard';
import { alphaClassOf } from '@/lib/design/alpha';

// ─── Alpha-ledger handles (Mike napkin #116, Tanya UIX #3 §2.1) ───────────
//
// The curated heading rule and the curated card border (`CURATED_REST` in
// `ExploreArticleCard.tsx`) share a rung — both `gold/muted`. Same warmth
// speaking the same line; the eye reads the curated band as one object,
// not "header + cards" (Tanya UIX #3 §2.1 — "one breath of gold").
// Module-scope so the per-file SSR pin can reach the handle without
// mounting the page; idiom mirrors `EvolutionThread.HAIRLINE_BORDER` /
// `ViaWhisper.WHISPER_TEXT` / `ResonanceSectionHeader.GOLD_RUNG`.
const CURATED_HEADING_RULE = alphaClassOf('gold', 'muted', 'bg');

// ─── Archetype affinity scoring ────────────────────────────

function getAffinityScore(article: Article, archetype: ArchetypeKey): number {
  const hasQ = article.questions?.length ? 1 : 0;
  return (article.tags?.length ?? 0) + hasQ * 2;
}

// ─── Component ─────────────────────────────────────────────

interface Props {
  articles: Article[];
}

export default function ArticlesPageClient({ articles }: Props) {
  const { archetype, recognitionTier } = useReturnRecognition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const showCurated = mounted && archetype && recognitionTier !== 'stranger';
  const curated = showCurated
    ? articles
        .map(a => ({ article: a, score: getAffinityScore(a, archetype!) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(x => x.article)
    : [];

  return (
    <div className="max-w-[48rem] mx-auto px-sys-7 py-sys-10">
      <header className="mb-sys-9">
        <h1 className="font-display text-foreground text-sys-h3 md:text-sys-h2 font-sys-display">
          Articles
        </h1>
        <p className="text-mist text-sys-caption italic mt-sys-1">
          Writing that pays attention back.
        </p>
      </header>

      {showCurated && (
        <CuratedRow curated={curated} archetype={archetype!} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-sys-7">
        {articles.map((article, i) => (
          <ExploreArticleCard
            key={article.id}
            article={article}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}

// ─── CuratedRow ────────────────────────────────────────────
// Tanya UX-100 §2: removed per-card `reason` text and the section-level
// "Matches your reading pattern" caption — both duplicated the archetype
// label which already answers "why is this section here?". Gold border
// carries the visual identity signal; the archetype label carries the copy.

function CuratedRow({
  curated,
  archetype,
}: {
  curated: Article[];
  archetype: ArchetypeKey;
}) {
  return (
    <section className="mb-sys-10">
      {/* Tanya UIX #3 §2.1, Mike napkin #116: the curated row's heading
          rule and the curated card border (`CURATED_REST`) share a rung —
          both `gold/muted`. Routed through the ledger via
          `CURATED_HEADING_RULE` at module scope so the SSR pin can reach
          the handle. The list goes 3 → 2; the curated band reads as one
          breath of gold. */}
      <div className="flex items-center gap-sys-4 mb-sys-7">
        <h2 className="font-display text-gold text-sys-xl font-sys-heading">
          {getExtensionLabel(archetype)}
        </h2>
        <div className={`flex-1 h-px ${CURATED_HEADING_RULE}`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-sys-5">
        {curated.map((article, i) => (
          <ExploreArticleCard
            key={article.id}
            article={article}
            variant="curated"
            index={i}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Test-only surface ────────────────────────────────────────────────────
//
// Surface the private `CuratedRow` + the resolved `CURATED_HEADING_RULE` to
// the per-file SSR pin (`__tests__/ArticlesPageClient.alpha.test.ts`). The
// shape mirrors `QuoteKeepsake.__testing__` and `ExploreArticleCard.
// __testing__` — the alpha-ledger graduation idiom in this repo.
export const __testing__ = { CuratedRow, CURATED_HEADING_RULE };
