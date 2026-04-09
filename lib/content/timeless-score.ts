/**
 * Timeless Score Engine - Foundation Module
 *
 * Measures an article's "timeless" value vs viral trends
 * Based on long-term engagement patterns, not short-term spikes
 *
 * Core Philosophy: Good content ages like wine, not milk
 */

import { Article } from './ContentTagger';

export interface TimelessSignals {
  totalViews: number;
  totalReads: number;
  avgReadingTime: number; // minutes
  commentCount: number;
  bookmarkCount: number;
  daysSincePublish: number;
}

export interface TimelessScore {
  score: number; // 0-100
  breakdown: {
    engagementQuality: number; // 0-100
    longevity: number; // 0-100
    depth: number; // 0-100
  };
}

/**
 * Calculate timeless score for an article
 *
 * High score = content that remains valuable over time
 * Low score = content that spikes then fades
 */
export function calculateTimelessScore(
  article: Article,
  signals: TimelessSignals
): TimelessScore {
  // Engagement Quality: Do people actually read it?
  const readRate = signals.totalViews > 0
    ? signals.totalReads / signals.totalViews
    : 0;

  const engagementQuality = Math.min(100, readRate * 100);

  // Longevity: Does it sustain interest over time?
  const viewsPerDay = signals.totalViews / Math.max(1, signals.daysSincePublish);
  const longevity = Math.min(100, viewsPerDay * 10);

  // Depth: Do people engage deeply?
  const bookmarkRate = signals.totalViews > 0
    ? signals.bookmarkCount / signals.totalViews
    : 0;

  const commentRate = signals.totalViews > 0
    ? signals.commentCount / signals.totalViews
    : 0;

  const depth = Math.min(100, (bookmarkRate * 50) + (commentRate * 50));

  // Weighted average (quality matters most)
  const score = (engagementQuality * 0.5) + (longevity * 0.3) + (depth * 0.2);

  return {
    score: Math.round(score),
    breakdown: {
      engagementQuality: Math.round(engagementQuality),
      longevity: Math.round(longevity),
      depth: Math.round(depth),
    },
  };
}

/**
 * Compare two articles by timeless score
 * Returns positive if a is more timeless than b
 */
export function compareByTimelessness(
  a: TimelessScore,
  b: TimelessScore
): number {
  return a.score - b.score;
}

