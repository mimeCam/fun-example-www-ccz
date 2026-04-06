/**
 * Enhanced Archetype Scoring — multi-signal archetype classification.
 *
 * Pure function: BehavioralSignalBag → { scores, confidence }.
 * No React, no hooks, no DB, no side effects.
 * Each archetype has a dedicated scoring function keyed to its reader profile.
 *
 * Confidence = gap between top two scores (not ratio).
 * If gap < 20, signals are ambiguous → caller should fall through to explorer.
 */

import type { ArchetypeKey } from '@/types/content';
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

// Deep Diver: goes slow, goes deep, stays long
function scoreDeepDiver(b: BehavioralSignalBag): number {
  let s = 0;
  if (b.maxDepth >= 85) s += 35; else if (b.maxDepth >= 70) s += 20;
  if (b.velocity < 0.5) s += 25; else if (b.velocity < 1.0) s += 15;
  if (b.pace > 1.2) s += 25; else if (b.pace > 1.0) s += 15;
  if (b.reReadCount >= 1 && b.reReadCount <= 2) s += 15;
  return clampScore(s);
}

// Explorer: fast, broad, moves on quickly
function scoreExplorer(b: BehavioralSignalBag): number {
  let s = 0;
  if (b.velocity > 2.0) s += 30; else if (b.velocity > 1.0) s += 20;
  if (b.pace < 0.7) s += 25; else if (b.pace < 0.9) s += 15;
  if (b.maxDepth > 30 && b.maxDepth < 70) s += 25;
  if (b.reReadCount === 0) s += 20;
  return clampScore(s);
}

// Faithful: steady pace, finishes, consistent
function scoreFaithful(b: BehavioralSignalBag): number {
  let s = 0;
  if (b.maxDepth >= 90) s += 30; else if (b.maxDepth >= 70) s += 20;
  if (b.velocity >= 0.5 && b.velocity <= 1.5) s += 30;
  if (b.pace >= 0.85 && b.pace <= 1.15) s += 25;
  if (b.reReadCount >= 1 && b.reReadCount <= 2) s += 15;
  return clampScore(s);
}

// Resonator: lingers, re-reads, feels deeply
function scoreResonator(b: BehavioralSignalBag): number {
  let s = 0;
  if (b.pace > 1.5) s += 35; else if (b.pace > 1.2) s += 20;
  if (b.reReadCount >= 3) s += 35; else if (b.reReadCount >= 2) s += 20;
  if (b.velocity < 1.0) s += 15;
  if (b.maxDepth >= 60) s += 15;
  return clampScore(s);
}

// Collector: skims, grabs, moves on — surface-level
function scoreCollector(b: BehavioralSignalBag): number {
  let s = 0;
  if (b.maxDepth < 35) s += 35; else if (b.maxDepth < 45) s += 15;
  if (b.pace < 0.5) s += 30; else if (b.pace < 0.7) s += 15;
  if (b.reReadCount === 0) s += 20;
  if (b.velocity > 1.5) s += 15;
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
