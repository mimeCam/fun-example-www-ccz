/**
 * Enhanced Archetype Scoring — multi-signal archetype classification.
 *
 * Pure function: BehavioralSignalBag → { scores, confidence }.
 * No React, no hooks, no DB, no side effects.
 * Each archetype has a dedicated scoring function keyed to its reader profile.
 *
 * Paragraph-level signals (deepReadRatio, engagementVariance,
 * peakParagraphCount, skipRatio) are optional bonuses. When absent,
 * scoring falls back to scroll-only behavior — backward compatible.
 *
 * Confidence = gap between top two scores (not ratio).
 * If gap < 20, signals are ambiguous → caller should fall through to explorer.
 */

import type { ArchetypeKey } from '@/types/content';
import type { ParagraphEngagementMap, ParagraphEngagementSummary } from '@/types/content';
import type { BehavioralSignalBag } from '@/lib/hooks/useBehavioralSignals';

export interface EnhancedScoreResult {
  scores: Record<ArchetypeKey, number>;
  confidence: number; // gap between top-2, raw points (not %)
}

const ARCHETYPES: ArchetypeKey[] = [
  'deep-diver', 'explorer', 'faithful', 'resonator', 'collector',
];

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

// ─── Paragraph Engagement Summary (pure function) ─────────

/** Deep-read threshold: paragraph dwell time in ms to count as "deep" */
const DEEP_READ_MS = 3000;
/** Skip threshold: dwell below this means the paragraph was skipped */
const SKIP_MS = 500;

/** Derive summary statistics from a raw paragraph engagement map. */
export function summarizeParagraphEngagement(
  map: ParagraphEngagementMap
): ParagraphEngagementSummary {
  const entries = Object.values(map);
  if (entries.length === 0) return emptySummary();

  const visited = entries.filter(e => !e.skipped);
  const deepReads = visited.filter(e => e.isDeepRead);
  const skipped = entries.filter(e => e.skipped);

  const deepReadRatio = visited.length > 0 ? deepReads.length / visited.length : 0;
  const skipRatio = entries.length > 0 ? skipped.length / entries.length : 0;

  const avgDwell = visited.length > 0
    ? visited.reduce((s, e) => s + e.dwellMs, 0) / visited.length
    : 0;

  const variance = computeVariance(visited, avgDwell);
  const peakParagraphCount = visited.filter(e => e.dwellMs > avgDwell * 2).length;

  return {
    deepReadRatio: clamp01(deepReadRatio),
    engagementVariance: clamp01(variance),
    peakParagraphCount,
    skipRatio: clamp01(skipRatio),
  };
}

function emptySummary(): ParagraphEngagementSummary {
  return { deepReadRatio: 0, engagementVariance: 0, peakParagraphCount: 0, skipRatio: 0 };
}

function computeVariance(entries: { dwellMs: number }[], avg: number): number {
  if (entries.length < 2 || avg === 0) return 0;
  const sumSq = entries.reduce((s, e) => s + (e.dwellMs - avg) ** 2, 0);
  const rawVar = sumSq / entries.length;
  return rawVar / (avg * avg); // coefficient of variation squared
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Check if paragraph signals are present and meaningful. */
function hasParagraphSignals(b: BehavioralSignalBag): boolean {
  return typeof b.deepReadRatio === 'number'
    && typeof b.skipRatio === 'number';
}

// ─── Archetype Scorers ─────────────────────────────────────

// Deep Diver: goes slow, goes deep, stays long
// Paragraph bonus: high deepReadRatio, low skipRatio
function scoreDeepDiver(b: BehavioralSignalBag): number {
  let s = 0;
  if (b.maxDepth >= 85) s += 35; else if (b.maxDepth >= 70) s += 20;
  if (b.velocity < 0.5) s += 25; else if (b.velocity < 1.0) s += 15;
  if (b.pace > 1.2) s += 25; else if (b.pace > 1.0) s += 15;
  if (b.reReadCount >= 1 && b.reReadCount <= 2) s += 15;
  if (hasParagraphSignals(b)) {
    if (b.deepReadRatio! >= 0.6) s += 15;
    if (b.skipRatio! <= 0.2) s += 10;
  }
  return clampScore(s);
}

// Explorer: fast, broad, moves on quickly
// Paragraph bonus: high variance, many peak paragraphs spread wide
function scoreExplorer(b: BehavioralSignalBag): number {
  let s = 0;
  if (b.velocity > 2.0) s += 30; else if (b.velocity > 1.0) s += 20;
  if (b.pace < 0.7) s += 25; else if (b.pace < 0.9) s += 15;
  if (b.maxDepth > 30 && b.maxDepth < 70) s += 25;
  if (b.reReadCount === 0) s += 20;
  if (hasParagraphSignals(b)) {
    if (b.engagementVariance! >= 0.3) s += 10;
    if ((b.peakParagraphCount ?? 0) >= 2) s += 10;
  }
  return clampScore(s);
}

// Faithful: steady pace, finishes, consistent
// Paragraph bonus: even engagement (low variance), low skip ratio
function scoreFaithful(b: BehavioralSignalBag): number {
  let s = 0;
  if (b.maxDepth >= 90) s += 25; else if (b.maxDepth >= 70) s += 15;
  if (b.velocity >= 0.5 && b.velocity <= 1.5) s += 30;
  if (b.pace >= 0.85 && b.pace <= 1.15) s += 25;
  if (b.reReadCount >= 1 && b.reReadCount <= 2) s += 10;
  if (b.maxDepth >= 95 && b.velocity >= 0.6) s += 10;
  if (hasParagraphSignals(b)) {
    if (b.engagementVariance! <= 0.2) s += 15;
    if (b.skipRatio! <= 0.1) s += 10;
  }
  return clampScore(s);
}

// Resonator: lingers, re-reads heavily, feels deeply
// Paragraph bonus: single-paragraph deep dwell spikes (high peak count relative to total)
function scoreResonator(b: BehavioralSignalBag): number {
  let s = 0;
  if (b.pace > 1.5) s += 20; else if (b.pace > 1.2) s += 10;
  if (b.reReadCount >= 4) s += 40; else if (b.reReadCount >= 3) s += 30; else if (b.reReadCount >= 2) s += 15;
  if (b.velocity < 1.0) s += 15;
  if (b.maxDepth >= 60) s += 15;
  if (b.pace > 1.0 && b.velocity < 0.8) s += 10;
  if (hasParagraphSignals(b)) {
    if (b.deepReadRatio! >= 0.3 && b.engagementVariance! >= 0.4) s += 15;
  }
  return clampScore(s);
}

// Collector: skims, grabs, moves on — surface-level
// Paragraph bonus: consistent moderate dwell, low variance (surface uniformity)
function scoreCollector(b: BehavioralSignalBag): number {
  let s = 0;
  if (b.maxDepth < 30) s += 35; else if (b.maxDepth < 40) s += 15;
  if (b.pace < 0.5) s += 30; else if (b.pace < 0.7) s += 15;
  if (b.reReadCount === 0) s += 20;
  if (b.velocity > 1.5) s += 15;
  if (hasParagraphSignals(b)) {
    if (b.skipRatio! >= 0.5) s += 15;
    if (b.deepReadRatio! <= 0.2) s += 10;
  }
  return clampScore(s);
}

const SCORERS: Record<ArchetypeKey, (b: BehavioralSignalBag) => number> = {
  'deep-diver': scoreDeepDiver,
  'explorer': scoreExplorer,
  'faithful': scoreFaithful,
  'resonator': scoreResonator,
  'collector': scoreCollector,
};

function computeScores(bag: BehavioralSignalBag): Record<ArchetypeKey, number> {
  const scores = {} as Record<ArchetypeKey, number>;
  ARCHETYPES.forEach(k => { scores[k] = SCORERS[k](bag); });
  return scores;
}

function sortedScores(scores: Record<ArchetypeKey, number>): number[] {
  return Object.values(scores).sort((a, b) => b - a);
}

/** The enhanced scoring engine — pure, testable, no surprises. */
export function enhancedScoring(bag: BehavioralSignalBag): EnhancedScoreResult {
  const scores = computeScores(bag);
  const [top, second] = sortedScores(scores);
  const confidence = Math.round(top - second);
  return { scores, confidence };
}
