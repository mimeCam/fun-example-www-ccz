/**
 * Tests for Book Whisper Engine, Season Engine, and Closing Line Engine.
 * Pure functions — no mocking needed. Pass context, assert output.
 */

import { synthesizeBookWhisper, detectChapterBreak } from '../book-whisper-engine';
import { getSeason } from '../season-engine';
import { synthesizeClosingLine } from '../closing-line-engine';
import type { BookNarrationContext, ClosingLineContext } from '@/types/book-narration';
import type { ResonanceWithArticle } from '@/types/resonance-display';

// ─── Helpers ────────────────────────────────────────────

function fakeResonance(overrides: Partial<ResonanceWithArticle> = {}): ResonanceWithArticle {
  return {
    id: 'r1',
    userId: 'u1',
    articleId: 'a1',
    articleTitle: 'Deep Work and Focus',
    resonanceNote: 'This resonated with me',
    quote: 'A selected quote',
    vitality: 25,
    status: 'active',
    visitCount: 1,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    ...overrides,
  };
}

function fakeContext(overrides: Partial<BookNarrationContext> = {}): BookNarrationContext {
  return {
    position: 1,
    total: 3,
    gapDays: 5,
    prev: fakeResonance(),
    curr: fakeResonance({ id: 'r2', createdAt: '2026-03-06T10:00:00Z' }),
    season: { key: 'spring', label: 'Spring', mood: ['waking'] },
    archetype: null,
    ...overrides,
  };
}

function fakeClosingCtx(overrides: Partial<ClosingLineContext> = {}): ClosingLineContext {
  return {
    resonance: fakeResonance({ vitality: 5 }),
    daysLived: 15,
    season: { key: 'autumn', label: 'Autumn', mood: ['reflective'] },
    ...overrides,
  };
}

// ─── Season Engine ──────────────────────────────────────

describe('getSeason', () => {
  it('returns winter for Jan 15', () => {
    expect(getSeason(new Date('2026-01-15')).key).toBe('winter');
  });

  it('returns winter for Dec 25', () => {
    expect(getSeason(new Date('2026-12-25')).key).toBe('winter');
  });

  it('returns spring for Apr 7', () => {
    expect(getSeason(new Date('2026-04-07')).key).toBe('spring');
  });

  it('returns summer for Jul 15', () => {
    expect(getSeason(new Date('2026-07-15')).key).toBe('summer');
  });

  it('returns autumn for Oct 15', () => {
    expect(getSeason(new Date('2026-10-15')).key).toBe('autumn');
  });

  it('returns mood tokens', () => {
    const s = getSeason(new Date('2026-01-15'));
    expect(s.mood.length).toBeGreaterThan(0);
  });
});

// ─── Book Whisper Engine ────────────────────────────────

describe('synthesizeBookWhisper', () => {
  it('returns a string for first resonance', () => {
    const ctx = fakeContext({ position: 0, total: 1, prev: null, gapDays: null });
    const result = synthesizeBookWhisper(ctx);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10);
  });

  it('returns winter-themed whisper for first resonance in winter', () => {
    const ctx = fakeContext({
      position: 0,
      total: 3,
      prev: null,
      gapDays: null,
      season: { key: 'winter', label: 'Winter', mood: ['quiet'] },
    });
    const result = synthesizeBookWhisper(ctx);
    expect(result).toContain('winter');
  });

  it('returns gap whisper for 14+ day gap', () => {
    const ctx = fakeContext({ gapDays: 16 });
    const result = synthesizeBookWhisper(ctx);
    expect(result).toContain('week');
  });

  it('returns month gap whisper for 30+ day gap', () => {
    const ctx = fakeContext({ gapDays: 35 });
    const result = synthesizeBookWhisper(ctx);
    expect(result).toContain('month');
  });

  it('detects topic echo between articles', () => {
    const prev = fakeResonance({ articleId: 'a1', articleTitle: 'Deep Work Matters' });
    const curr = fakeResonance({ id: 'r2', articleId: 'a2', articleTitle: 'Deep Work in Practice' });
    const ctx = fakeContext({ prev, curr, gapDays: 2 });
    const result = synthesizeBookWhisper(ctx);
    expect(result).toContain('echo');
  });

  it('detects same article resonance', () => {
    const prev = fakeResonance({ articleId: 'a1' });
    const curr = fakeResonance({ id: 'r2', articleId: 'a1' });
    const ctx = fakeContext({ prev, curr, gapDays: 2 });
    const result = synthesizeBookWhisper(ctx);
    expect(result).toContain('same article');
  });

  it('returns late whisper for last position with 3+ total', () => {
    const ctx = fakeContext({ position: 2, total: 3, gapDays: 1 });
    const result = synthesizeBookWhisper(ctx);
    expect(typeof result).toBe('string');
  });

  it('returns archetype whisper for deep-diver', () => {
    const prev = fakeResonance({ articleId: 'a1', articleTitle: 'Systems Thinking' });
    const curr = fakeResonance({ id: 'r2', articleId: 'a2', articleTitle: 'Constraint Design' });
    const ctx = fakeContext({ archetype: 'deep-diver', gapDays: 1, prev, curr });
    const result = synthesizeBookWhisper(ctx);
    expect(result.toLowerCase()).toContain('deep');
  });

  it('falls back gracefully with no matching triggers', () => {
    const ctx = fakeContext({ gapDays: 1, archetype: null, season: { key: 'spring', label: 'Spring', mood: [] } });
    const result = synthesizeBookWhisper(ctx);
    expect(typeof result).toBe('string');
  });
});

// ─── Chapter Break Detection ────────────────────────────

describe('detectChapterBreak', () => {
  it('returns break for 14+ day gap', () => {
    const prev = new Date('2026-03-01');
    const curr = new Date('2026-03-20');
    const result = detectChapterBreak(prev, curr);
    expect(result.isBreak).toBe(true);
    expect(result.daysGap).toBe(19);
  });

  it('returns break for 30+ day gap with month label', () => {
    const prev = new Date('2026-01-01');
    const curr = new Date('2026-02-15');
    const result = detectChapterBreak(prev, curr);
    expect(result.isBreak).toBe(true);
    expect(result.label).toContain('month');
  });

  it('returns no break for short gap', () => {
    const prev = new Date('2026-03-01');
    const curr = new Date('2026-03-05');
    const result = detectChapterBreak(prev, curr);
    expect(result.isBreak).toBe(false);
  });
});

// ─── Closing Line Engine ────────────────────────────────

describe('synthesizeClosingLine', () => {
  it('returns closing line for 20+ day resonance', () => {
    const ctx = fakeClosingCtx({ daysLived: 25 });
    const result = synthesizeClosingLine(ctx);
    expect(result).toContain('25 days');
  });

  it('returns movement line for 10-19 days', () => {
    const ctx = fakeClosingCtx({ daysLived: 12 });
    const result = synthesizeClosingLine(ctx);
    expect(result).toContain('movement');
  });

  it('returns winter line for winter season', () => {
    const ctx = fakeClosingCtx({
      daysLived: 8,
      season: { key: 'winter', label: 'Winter', mood: ['quiet'] },
    });
    const result = synthesizeClosingLine(ctx);
    expect(result).toContain('warmed');
  });

  it('returns brief line for short-lived resonance', () => {
    const ctx = fakeClosingCtx({
      daysLived: 3,
      season: { key: 'spring', label: 'Spring', mood: ['waking'] },
    });
    const result = synthesizeClosingLine(ctx);
    expect(result).toContain('trace');
  });

  it('always returns a string (never empty)', () => {
    const ctx = fakeClosingCtx({ daysLived: 100 });
    const result = synthesizeClosingLine(ctx);
    expect(result.length).toBeGreaterThan(0);
  });
});
