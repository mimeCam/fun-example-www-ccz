/**
 * Whisper Engine Tests — verify behavior-specific whisper selection.
 *
 * Each test constructs a signal bag + paragraph map representing a specific
 * reading behavior and asserts that the correct whisper template fires.
 * Also tests: fallback when no template matches, empty paragraph map,
 * and that every archetype produces a non-empty string.
 */

import { synthesizeWhisper } from '../whisper-engine';
import type { BehavioralSignalBag } from '@/lib/hooks/useBehavioralSignals';
import type { ParagraphEngagementMap } from '@/types/content';
import type { ArchetypeKey } from '@/types/content';

type Bag = Partial<BehavioralSignalBag>;

function bag(overrides: Bag): BehavioralSignalBag {
  return {
    depth: 0, velocity: 0, reReadCount: 0,
    dwellSecs: 0, pace: 0, maxDepth: 0,
    ...overrides,
  };
}

function emptyMap(): ParagraphEngagementMap {
  return {};
}

function makeMap(
  overrides: Partial<Record<string, { dwellMs?: number; visits?: number; isDeepRead?: boolean; skipped?: boolean }>>
): ParagraphEngagementMap {
  const map: ParagraphEngagementMap = {};
  for (const [id, o] of Object.entries(overrides)) {
    map[id] = {
      paragraphId: id,
      dwellMs: o?.dwellMs ?? 1000,
      visits: o?.visits ?? 1,
      isDeepRead: o?.isDeepRead ?? false,
      skipped: o?.skipped ?? false,
    };
  }
  return map;
}

// ─── Deep Diver ───────────────────────────────────────────

test('deep-diver: high deep-read ratio + slow pace → study whisper', () => {
  const result = synthesizeWhisper('deep-diver', bag({
    deepReadRatio: 0.8, pace: 1.5,
  }), makeMap({
    p1: { dwellMs: 5000, visits: 2, isDeepRead: true },
    p2: { dwellMs: 6000, visits: 1, isDeepRead: true },
  }));
  expect(result).toContain('studied');
});

test('deep-diver: many re-reads → depth whisper', () => {
  const result = synthesizeWhisper('deep-diver', bag({
    reReadCount: 4,
  }), emptyMap());
  expect(result).toContain('4 times');
  expect(result).toContain('depth');
});

test('deep-diver: high deep-read ratio → camped whisper', () => {
  const result = synthesizeWhisper('deep-diver', bag({
    deepReadRatio: 0.7, pace: 1.0,
  }), makeMap({
    p1: { dwellMs: 5000, visits: 1, isDeepRead: true },
    p2: { dwellMs: 2000, visits: 1, isDeepRead: false },
  }));
  expect(result).toContain('camped');
});

test('deep-diver: slow pace + low velocity → thorough whisper', () => {
  const result = synthesizeWhisper('deep-diver', bag({
    pace: 2.0, velocity: 0.3, deepReadRatio: 0.3,
  }), emptyMap());
  expect(result).toContain('thorough');
});

test('deep-diver: high depth + re-reads → finish whisper', () => {
  const result = synthesizeWhisper('deep-diver', bag({
    maxDepth: 95, reReadCount: 2, deepReadRatio: 0.3,
  }), emptyMap());
  expect(result).toContain('deep diver');
});

// ─── Explorer ─────────────────────────────────────────────

test('explorer: high variance + high velocity → sampled whisper', () => {
  const result = synthesizeWhisper('explorer', bag({
    engagementVariance: 0.5, velocity: 2.0,
  }), emptyMap());
  expect(result).toContain('sampled');
});

test('explorer: high skip ratio + peaks → really read them whisper', () => {
  const result = synthesizeWhisper('explorer', bag({
    skipRatio: 0.6, peakParagraphCount: 3,
  }), makeMap({
    p1: { dwellMs: 5000, visits: 1, isDeepRead: true },
    p2: { dwellMs: 100, visits: 0, isDeepRead: false, skipped: true },
    p3: { dwellMs: 50, visits: 0, isDeepRead: false, skipped: true },
  }));
  expect(result).toContain('skipped');
  expect(result).toContain('really read');
});

test('explorer: fast velocity + low pace → fast eyes whisper', () => {
  const result = synthesizeWhisper('explorer', bag({
    velocity: 3.0, pace: 0.5,
  }), emptyMap());
  expect(result).toContain('Fast eyes');
});

test('explorer: mid depth → scout whisper', () => {
  const result = synthesizeWhisper('explorer', bag({
    maxDepth: 50, velocity: 0.5,
  }), makeMap({
    p1: { dwellMs: 1000, visits: 1 },
    p2: { dwellMs: 800, visits: 1 },
    p3: { dwellMs: 900, visits: 1 },
  }));
  expect(result).toContain('scout');
});

// ─── Faithful ─────────────────────────────────────────────

test('faithful: low variance + high depth → steady whisper', () => {
  const result = synthesizeWhisper('faithful', bag({
    engagementVariance: 0.1, maxDepth: 95,
  }), emptyMap());
  expect(result).toContain('Steady');
});

test('faithful: on-pace reading → exactly the pace whisper', () => {
  const result = synthesizeWhisper('faithful', bag({
    pace: 1.0, velocity: 0.8,
  }), emptyMap());
  expect(result).toContain('exactly the pace');
});

test('faithful: low skip ratio + high depth → all paragraphs whisper', () => {
  const result = synthesizeWhisper('faithful', bag({
    skipRatio: 0.05, maxDepth: 90,
  }), makeMap({
    p1: { dwellMs: 2000, visits: 1 },
    p2: { dwellMs: 1800, visits: 1 },
    p3: { dwellMs: 2100, visits: 1 },
  }));
  expect(result).toContain('paragraphs');
  expect(result).toContain('commitment');
});

test('faithful: moderate re-reads → care whisper', () => {
  const result = synthesizeWhisper('faithful', bag({
    reReadCount: 2, velocity: 0.8, skipRatio: 0.3,
  }), emptyMap());
  expect(result).toContain('care');
});

// ─── Resonator ────────────────────────────────────────────

test('resonator: very high re-reads → coming back whisper', () => {
  const result = synthesizeWhisper('resonator', bag({
    reReadCount: 6,
  }), emptyMap());
  expect(result).toContain('6 times');
  expect(result).toContain('resonated');
});

test('resonator: high variance + deep reads → held you whisper', () => {
  const result = synthesizeWhisper('resonator', bag({
    deepReadRatio: 0.5, engagementVariance: 0.5,
  }), makeMap({
    p1: { dwellMs: 8000, visits: 2, isDeepRead: true },
    p2: { dwellMs: 1000, visits: 1 },
  }));
  expect(result).toContain('held you');
  expect(result).toContain('felt something');
});

test('resonator: moderate re-reads + high pace → feelings whisper', () => {
  const result = synthesizeWhisper('resonator', bag({
    reReadCount: 3, pace: 1.5,
  }), emptyMap());
  expect(result).toContain('feelings');
});

test('resonator: many peak paragraphs + low velocity → respond whisper', () => {
  const result = synthesizeWhisper('resonator', bag({
    peakParagraphCount: 4, velocity: 0.5,
  }), emptyMap());
  expect(result).toContain('respond');
});

// ─── Collector ────────────────────────────────────────────

test('collector: high skip ratio → breezed through whisper', () => {
  const result = synthesizeWhisper('collector', bag({
    skipRatio: 0.7,
  }), makeMap({
    p1: { dwellMs: 200, visits: 0, isDeepRead: false, skipped: true },
    p2: { dwellMs: 150, visits: 0, isDeepRead: false, skipped: true },
    p3: { dwellMs: 800, visits: 1 },
  }));
  expect(result).toContain('breezed');
  expect(result).toContain('gathering');
});

test('collector: fast + shallow → broad sweep whisper', () => {
  const result = synthesizeWhisper('collector', bag({
    pace: 0.3, velocity: 2.0,
  }), emptyMap());
  expect(result).toContain('broad sweep');
});

test('collector: low deep-read + shallow depth → surveyor whisper', () => {
  const result = synthesizeWhisper('collector', bag({
    deepReadRatio: 0.1, maxDepth: 30,
  }), makeMap({
    p1: { dwellMs: 500, visits: 1 },
    p2: { dwellMs: 300, visits: 1 },
  }));
  expect(result).toContain('surveyor');
});

// ─── Fallback ─────────────────────────────────────────────

test('falls back to static whisper when no behavior matches', () => {
  const result = synthesizeWhisper('deep-diver', bag({
    depth: 10, velocity: 0.1, reReadCount: 0,
    dwellSecs: 5, pace: 0.1, maxDepth: 10,
  }), emptyMap());
  expect(result).toBe('You don\u2019t skim surfaces \u2014 you dive deep and emerge transformed.');
});

test('all archetypes return non-empty string with empty data', () => {
  const archetypes: ArchetypeKey[] = [
    'deep-diver', 'explorer', 'faithful', 'resonator', 'collector',
  ];
  archetypes.forEach(a => {
    const result = synthesizeWhisper(a, bag({}), emptyMap());
    expect(result.length).toBeGreaterThan(10);
  });
});

// ─── No Mutation ──────────────────────────────────────────

test('does not mutate input paragraph map', () => {
  const map = makeMap({
    p1: { dwellMs: 5000, visits: 1, isDeepRead: true },
  });
  const frozen = JSON.stringify(map);
  synthesizeWhisper('deep-diver', bag({ deepReadRatio: 0.8, pace: 1.5 }), map);
  expect(JSON.stringify(map)).toBe(frozen);
});
