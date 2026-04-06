/**
 * Enhanced Scoring Tests — verify archetype classification accuracy.
 *
 * Each test constructs a BehavioralSignalBag representing an "ideal reader"
 * for a given archetype and asserts that archetype wins with clear margin.
 * Edge cases: equal scores, low signals, zero dwell time.
 *
 * Updated for tuned Faithful/Resonator/Collector formulas.
 */

import { enhancedScoring } from '../enhanced-scoring';
import type { BehavioralSignalBag } from '@/lib/hooks/useBehavioralSignals';

type Bag = Partial<BehavioralSignalBag>;

function bag(overrides: Bag): BehavioralSignalBag {
  return {
    depth: 0, velocity: 0, reReadCount: 0,
    dwellSecs: 0, pace: 0, maxDepth: 0,
    ...overrides,
  };
}

function winner(result: ReturnType<typeof enhancedScoring>) {
  const entries = Object.entries(result.scores) as [string, number][];
  entries.sort(([, a], [, b]) => b - a);
  return entries[0][0];
}

// ─── Deep Diver: slow, deep, thorough ───

test('deep-diver wins for slow deep reader', () => {
  const result = enhancedScoring(bag({
    depth: 90, velocity: 0.3, reReadCount: 2,
    dwellSecs: 600, pace: 1.5, maxDepth: 92,
  }));
  expect(winner(result)).toBe('deep-diver');
  expect(result.confidence).toBeGreaterThanOrEqual(20);
});

test('deep-diver scores above 60 for ideal profile', () => {
  const result = enhancedScoring(bag({
    depth: 95, velocity: 0.2, reReadCount: 2,
    dwellSecs: 900, pace: 2.0, maxDepth: 97,
  }));
  expect(result.scores['deep-diver']).toBeGreaterThanOrEqual(60);
});

// ─── Explorer: fast, broad, short dwell ───

test('explorer wins for fast skimmer with variable depth', () => {
  const result = enhancedScoring(bag({
    depth: 45, velocity: 2.5, reReadCount: 0,
    dwellSecs: 120, pace: 0.4, maxDepth: 50,
  }));
  expect(winner(result)).toBe('explorer');
  expect(result.confidence).toBeGreaterThanOrEqual(20);
});

// ─── Faithful: steady, complete, on-pace ───

test('faithful wins for steady complete reader', () => {
  const result = enhancedScoring(bag({
    depth: 95, velocity: 1.0, reReadCount: 1,
    dwellSecs: 480, pace: 1.0, maxDepth: 97,
  }));
  expect(winner(result)).toBe('faithful');
  expect(result.confidence).toBeGreaterThanOrEqual(20);
});

test('faithful scores high for on-pace reader who finishes', () => {
  const result = enhancedScoring(bag({
    depth: 100, velocity: 0.9, reReadCount: 2,
    dwellSecs: 500, pace: 1.05, maxDepth: 100,
  }));
  expect(result.scores['faithful']).toBeGreaterThanOrEqual(70);
});

// ─── Resonator: lingers, re-reads heavily, emotional ───

test('resonator wins for heavy re-reader with high dwell', () => {
  const result = enhancedScoring(bag({
    depth: 75, velocity: 0.4, reReadCount: 5,
    dwellSecs: 900, pace: 2.0, maxDepth: 80,
  }));
  expect(winner(result)).toBe('resonator');
  expect(result.confidence).toBeGreaterThanOrEqual(20);
});

test('resonator separates from deep-diver (low re-reads go to deep-diver)', () => {
  const result = enhancedScoring(bag({
    depth: 90, velocity: 0.3, reReadCount: 1,
    dwellSecs: 600, pace: 1.5, maxDepth: 92,
  }));
  // With only 1 re-read, deep-diver should win over resonator
  expect(winner(result)).toBe('deep-diver');
});

// ─── Collector: shallow, quick, no re-reads ───

test('collector wins for shallow fast reader', () => {
  const result = enhancedScoring(bag({
    depth: 20, velocity: 2.0, reReadCount: 0,
    dwellSecs: 60, pace: 0.2, maxDepth: 25,
  }));
  expect(winner(result)).toBe('collector');
  expect(result.confidence).toBeGreaterThanOrEqual(20);
});

test('collector separates from explorer (mid-depth goes to explorer)', () => {
  const result = enhancedScoring(bag({
    depth: 50, velocity: 2.5, reReadCount: 0,
    dwellSecs: 120, pace: 0.4, maxDepth: 55,
  }));
  // Mid-depth + fast = explorer, not collector
  expect(winner(result)).toBe('explorer');
});

// ─── Edge Cases ───

test('zero signals produces valid structure', () => {
  const result = enhancedScoring(bag({}));
  expect(Object.keys(result.scores)).toHaveLength(5);
  expect(result.confidence).toBeGreaterThanOrEqual(0);
});

test('all scores are clamped 0–100', () => {
  const result = enhancedScoring(bag({
    depth: 100, velocity: 10, reReadCount: 50,
    dwellSecs: 9999, pace: 99, maxDepth: 100,
  }));
  Object.values(result.scores).forEach(s => {
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});

test('confidence is gap between top two scores', () => {
  const result = enhancedScoring(bag({
    depth: 80, velocity: 0.8, reReadCount: 1,
    dwellSecs: 480, pace: 1.0, maxDepth: 85,
  }));
  const vals = Object.values(result.scores).sort((a, b) => b - a);
  expect(result.confidence).toBe(vals[0] - vals[1]);
});

test('ambiguous signals yield lower confidence than clear profiles', () => {
  const result = enhancedScoring(bag({
    depth: 50, velocity: 1.0, reReadCount: 0,
    dwellSecs: 240, pace: 0.8, maxDepth: 55,
  }));
  expect(result.confidence).toBeLessThanOrEqual(35);
});
