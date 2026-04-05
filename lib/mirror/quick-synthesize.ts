/**
 * Quick Mirror Synthesis — resolves archetype from a SINGLE article read.
 *
 * Pure function: scroll behavior + time → archetype.
 * No React, no hooks, no DB, no side effects.
 * Runs entirely client-side after the reader hits 70% scroll depth.
 */

import type { ArchetypeKey } from '@/types/content';

export interface QuickMirrorInput {
  scrollDepth: number;       // 0–100
  timeOnPage: number;        // seconds
  estimatedReadTime: number; // minutes
  articleTopics: string[];   // categories/tags
}

export interface QuickMirrorResult {
  archetype: ArchetypeKey;
  archetypeLabel: string;
  whisper: string;
  confidence: number;        // 0–100
  scores: { depth: number; breadth: number; consistency: number };
}

const LABELS: Record<ArchetypeKey, string> = {
  'deep-diver': 'The Deep Diver',
  'explorer': 'The Explorer',
  'faithful': 'The Faithful',
  'resonator': 'The Resonator',
  'collector': 'The Collector',
};

const WHISPERS: Record<ArchetypeKey, string> = {
  'deep-diver': "You don\u2019t skim surfaces \u2014 you dive deep and emerge transformed.",
  'explorer': "Your curiosity has no borders \u2014 every topic is uncharted territory.",
  'faithful': "Day after day, you show up. Consistency is your quiet superpower.",
  'resonator': "You don\u2019t just read \u2014 you feel. Every resonance is a fingerprint of your mind.",
  'collector': "Your appetite for ideas is boundless \u2014 a personal library in the making.",
};

function readingPace(timeOnPage: number, estimatedMin: number): number {
  return estimatedMin <= 0 ? 1 : (timeOnPage / 60) / estimatedMin;
}

function scoreArchetypes(i: QuickMirrorInput): Record<ArchetypeKey, number> {
  const pace = readingPace(i.timeOnPage, i.estimatedReadTime);
  return {
    'deep-diver': i.scrollDepth * pace * 1.2,
    'explorer': i.articleTopics.length * 20 + (pace < 0.8 ? 30 : 0),
    'faithful': Math.min(100, i.scrollDepth * 1.1),
    'resonator': i.timeOnPage > i.estimatedReadTime * 120 ? 85 : 30,
    'collector': (100 - i.scrollDepth) + (pace < 0.5 ? 40 : 0),
  };
}

function pickTop(scores: Record<ArchetypeKey, number>): ArchetypeKey {
  return (Object.entries(scores) as [ArchetypeKey, number][])
    .sort(([, a], [, b]) => b - a)[0][0];
}

function calcConfidence(top: number, all: Record<ArchetypeKey, number>): number {
  const total = Object.values(all).reduce((a, b) => a + b, 0) || 1;
  return Math.round((top / total) * 100);
}

function buildScores(i: QuickMirrorInput) {
  const pace = readingPace(i.timeOnPage, i.estimatedReadTime);
  return {
    depth: Math.min(100, Math.round(i.scrollDepth * pace)),
    breadth: Math.min(100, i.articleTopics.length * 20),
    consistency: Math.min(100, Math.round(i.scrollDepth)),
  };
}

function fallback(i: QuickMirrorInput): QuickMirrorResult {
  return {
    archetype: 'explorer',
    archetypeLabel: 'The Curious Reader',
    whisper: "You\u2019re just getting started \u2014 every great reader begins with curiosity.",
    confidence: 0,
    scores: buildScores(i),
  };
}

/** The core synthesis — one call, pure function, no surprises. */
export function quickSynthesize(input: QuickMirrorInput): QuickMirrorResult {
  const scores = scoreArchetypes(input);
  const archetype = pickTop(scores);
  const conf = calcConfidence(scores[archetype], scores);
  if (conf < 40) return fallback(input);
  return {
    archetype,
    archetypeLabel: LABELS[archetype],
    whisper: WHISPERS[archetype],
    confidence: conf,
    scores: buildScores(input),
  };
}
