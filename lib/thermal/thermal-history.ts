/**
 * Thermal History — accumulates reading signals across sessions.
 *
 * Reads/writes a ThermalHistory blob from localStorage.
 * Converts it to ThermalInput for the score engine.
 * Pure functions. No React, no DOM (except safeGetItem/safeSetItem wrappers).
 */

import { safeGetItem, safeSetItem } from '@/lib/utils/storage';
import type { ThermalInput } from './thermal-score';

export interface ThermalHistory {
  articleIds: string[];
  articleDepths: Record<string, number>;  // max scroll depth per article (0-100)
  totalDwellSecs: number;
  resonanceCount: number;
  visitDays: string[];                     // ISO date strings, unique
}

const STORAGE_KEY = 'thermal-history';

export function emptyHistory(): ThermalHistory {
  return { articleIds: [], articleDepths: {}, totalDwellSecs: 0, resonanceCount: 0, visitDays: [] };
}

export function loadHistory(): ThermalHistory {
  return safeGetItem<ThermalHistory>(STORAGE_KEY) ?? emptyHistory();
}

export function saveHistory(h: ThermalHistory): void {
  safeSetItem(STORAGE_KEY, h);
}

/** Add today's date if not already present. Returns ISO date string. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Record that an article was read with the given max depth and dwell time. */
export function accumulateArticle(
  h: ThermalHistory,
  articleId: string,
  maxDepth: number,
  dwellSecs: number,
): ThermalHistory {
  const ids = h.articleIds.includes(articleId) ? h.articleIds : [...h.articleIds, articleId];
  const today = todayIso();
  const days = h.visitDays.includes(today) ? h.visitDays : [...h.visitDays, today];
  return {
    articleIds: ids,
    articleDepths: { ...h.articleDepths, [articleId]: Math.max(h.articleDepths[articleId] ?? 0, maxDepth) },
    totalDwellSecs: h.totalDwellSecs + dwellSecs,
    resonanceCount: h.resonanceCount,
    visitDays: days,
  };
}

/** Increment resonance count. */
export function addResonance(h: ThermalHistory): ThermalHistory {
  return { ...h, resonanceCount: h.resonanceCount + 1 };
}

/** Convert accumulated history into score engine input. */
export function toThermalInput(h: ThermalHistory): ThermalInput {
  const depths = Object.values(h.articleDepths);
  const avg = depths.length ? depths.reduce((a, b) => a + b, 0) / depths.length : 0;
  return {
    articlesRead: h.articleIds.length,
    totalDwellSecs: h.totalDwellSecs,
    avgScrollDepth: avg,
    resonanceCount: h.resonanceCount,
    visitDays: h.visitDays.length,
  };
}
