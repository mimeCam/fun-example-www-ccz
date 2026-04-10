/**
 * Archetype-Aware Recommendation Engine
 *
 * Pure function: archetype + current article + candidates + history → ranked list.
 * No React, no hooks, no DB — just scoring logic.
 *
 * Each archetype gets a different weighting strategy:
 *   deep-diver  → depth (tag overlap, content richness)
 *   explorer    → diversity (different worldview, cross-topic)
 *   faithful    → continuity (same worldview, thematic chain)
 *   resonator   → emotional resonance (re-read-aligned topics)
 *   collector   → breadth (shorter reads, broad topics)
 */

import type { ArchetypeKey } from '@/types/content';
import type { Article } from './ContentTagger';
import type { FilterType } from '@/types/filter';

export interface RankedRecommendation {
  article: Article;
  score: number;
  reason: string;
}

// ─── Per-Archetype Weight Sets ─────────────────────────────

type WeightSet = {
  tagOverlap: number;
  sameWorldview: number;
  diffWorldview: number;
  contentLength: number;  // positive = prefer longer
  novelty: number;        // bonus for unread
};

const WEIGHTS: Record<ArchetypeKey, WeightSet> = {
  'deep-diver':  { tagOverlap: 3, sameWorldview: 2, diffWorldview: 0, contentLength: 1.5, novelty: 1 },
  'explorer':    { tagOverlap: 0.5, sameWorldview: 0, diffWorldview: 3, contentLength: 0, novelty: 2 },
  'faithful':    { tagOverlap: 2, sameWorldview: 3, diffWorldview: 0, contentLength: 0.5, novelty: 1 },
  'resonator':   { tagOverlap: 2.5, sameWorldview: 1, diffWorldview: 0.5, contentLength: 1, novelty: 1.5 },
  'collector':   { tagOverlap: 1, sameWorldview: 0, diffWorldview: 1.5, contentLength: -1, novelty: 2 },
};

// ─── Reason Templates ──────────────────────────────────────

type ReasonTemplate = { trigger: (s: number, w: boolean) => boolean; text: string };

const REASON_TEMPLATES: Record<ArchetypeKey, ReasonTemplate[]> = {
  'deep-diver': [
    { trigger: (s, _) => s >= 8, text: 'As someone who goes deep, the third paragraph of this piece was written for a reader like you.' },
    { trigger: (s, w) => s >= 5 && w, text: 'You went deep on this topic. Here\'s another layer waiting to be uncovered.' },
    { trigger: (_, __) => true, text: 'This one rewards the kind of careful reading you\'ve been doing.' },
  ],
  'explorer': [
    { trigger: (s, _) => s >= 6, text: 'This opens a door you haven\'t tried yet. The connections are worth the detour.' },
    { trigger: (_, w) => !w, text: 'A completely different angle — exactly the kind of territory explorers thrive in.' },
    { trigger: (_, __) => true, text: 'Ready for a different perspective? This one connects dots you haven\'t seen yet.' },
  ],
  'faithful': [
    { trigger: (_, w) => w, text: 'This builds on what you just read. Same foundation, new perspective.' },
    { trigger: (s, _) => s >= 4, text: 'You\'ve found your footing here. This next piece deepens the path you\'re on.' },
    { trigger: (_, __) => true, text: 'A natural next step from where you are now.' },
  ],
  'resonator': [
    { trigger: (s, _) => s >= 5, text: 'The moments that made you pause in this article? They echo here.' },
    { trigger: (_, w) => w, text: 'This resonates with the same frequency. Let it settle.' },
    { trigger: (_, __) => true, text: 'Something about this one might make you stop and think.' },
  ],
  'collector': [
    { trigger: (s, _) => s >= 4, text: 'A concise read that adds a new lens to your collection.' },
    { trigger: (_, w) => !w, text: 'Short, sharp, and a perspective you don\'t have yet.' },
    { trigger: (_, __) => true, text: 'A quick addition to the mental library you\'re building.' },
  ],
};

// ─── Scoring Helpers ───────────────────────────────────────

function tagOverlap(tagsA: string[], tagsB: string[]): number {
  if (!tagsA.length || !tagsB.length) return 0;
  const shared = tagsA.filter(t => tagsB.includes(t)).length;
  return shared / Math.max(tagsA.length, tagsB.length);
}

function isSameWorldview(a: Article, b: Article): boolean {
  return !!a.worldview && a.worldview === b.worldview;
}

function contentScore(article: Article): number {
  return article.content.split(/\s+/).length / 200; // ~reading time
}

// ─── Public API ────────────────────────────────────────────

/** Score a single candidate against the current article for a given archetype. */
export function scoreCandidate(
  current: Article,
  candidate: Article,
  archetype: ArchetypeKey,
  isRead: boolean,
): number {
  const w = WEIGHTS[archetype];
  const overlap = tagOverlap(current.tags ?? [], candidate.tags ?? []);
  const same = isSameWorldview(current, candidate);
  const length = contentScore(candidate);
  const novelty = isRead ? 0 : 1;

  return (
    w.tagOverlap * overlap +
    (same ? w.sameWorldview : w.diffWorldview) +
    w.contentLength * length +
    w.novelty * novelty
  );
}

/** Pick the best reason template for a scored recommendation. */
export function pickReason(
  archetype: ArchetypeKey,
  score: number,
  sameWorldview: boolean,
): string {
  const templates = REASON_TEMPLATES[archetype];
  const match = templates.find(t => t.trigger(score, sameWorldview));
  return match?.text ?? 'Worth a read.';
}

/** Default recommendation — tag-based fallback for readers with no archetype. */
export function defaultRecommendation(
  current: Article,
  candidates: Article[],
  readHistory: string[] = [],
): RankedRecommendation | null {
  const unread = candidates.filter(c => !readHistory.includes(c.id));
  const pool = unread.length > 0 ? unread : candidates;
  if (pool.length === 0) return null;

  const ranked = pool
    .map(c => ({ article: c, score: tagOverlap(current.tags ?? [], c.tags ?? []) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const overlap = tagOverlap(current.tags ?? [], best.article.tags ?? []);

  return {
    article: best.article,
    score: best.score,
    reason: overlap > 0
      ? `You just explored ${current.tags?.[0]?.replace(/-/g, ' ') ?? 'this topic'}. Here's another angle worth considering.`
      : 'A fresh perspective waiting for you.',
  };
}

/**
 * Main entry point: rank all candidates for a given archetype.
 * Returns sorted list (best first) with scores and reasons.
 */
export function rankArticlesForArchetype(
  current: Article,
  candidates: Article[],
  archetype: ArchetypeKey | null,
  readHistory: string[] = [],
): RankedRecommendation[] {
  if (candidates.length === 0) return [];
  if (!archetype) {
    const fallback = defaultRecommendation(current, candidates, readHistory);
    return fallback ? [fallback] : [];
  }

  const readSet = new Set(readHistory);
  return candidates
    .map(candidate => {
      const score = scoreCandidate(current, candidate, archetype, readSet.has(candidate.id));
      const reason = pickReason(archetype, score, isSameWorldview(current, candidate));
      return { article: candidate, score, reason };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Convenience: get the single best recommendation.
 * Returns null when there are no candidates.
 */
export function bestRecommendation(
  current: Article,
  candidates: Article[],
  archetype: ArchetypeKey | null,
  readHistory: string[] = [],
): RankedRecommendation | null {
  const ranked = rankArticlesForArchetype(current, candidates, archetype, readHistory);
  return ranked[0] ?? null;
}
