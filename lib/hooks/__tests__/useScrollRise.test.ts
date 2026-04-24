/**
 * useScrollRise — structural + logic tests.
 *
 * Strategy: source-file analysis (same pattern as useScrollDepth.test.ts)
 * for structural invariants, plus pure-function unit tests for the stagger
 * formula and data-attribute contract. DOM interaction is verified via
 * the CSS sync test (scroll-rise-sync.test.ts).
 *
 * Credits: Mike K. (napkin #7 — structural test spec), Tanya D. (UX #100 —
 * stagger cap 300ms, threshold 0.15, one-shot semantics).
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import {
  riseDelay,
  SCROLL_RISE_STAGGER_STEP_MS,
  SCROLL_RISE_STAGGER_CAP_MS,
} from '../useScrollRise';

const SRC = readFileSync(join(__dirname, '../useScrollRise.ts'), 'utf-8');

// ─── Module shape ─────────────────────────────────────────────────────────────

describe('useScrollRise module shape', () => {
  it('exports useScrollRise hook', () => {
    expect(SRC).toMatch(/export function useScrollRise/);
  });

  it('exports riseDelay helper (stagger formula)', () => {
    expect(SRC).toMatch(/export function riseDelay/);
  });

  it('exports stagger constants for test pinning', () => {
    expect(SRC).toMatch(/export const SCROLL_RISE_STAGGER_STEP_MS/);
    expect(SRC).toMatch(/export const SCROLL_RISE_STAGGER_CAP_MS/);
  });

  it('uses a single shared IntersectionObserver (singleton pattern)', () => {
    const matches = SRC.match(/new IntersectionObserver/g);
    expect(matches).toHaveLength(1);
  });

  it('threshold is 0.15 — card must be 15% visible before rising', () => {
    expect(SRC).toMatch(/threshold:\s*0\.15/);
  });

  it('one-shot: unobserves immediately on trigger', () => {
    expect(SRC).toMatch(/unobserve/);
    expect(SRC).toMatch(/entryCallbacks\.delete/);
  });

  it('mount guard: 50ms setTimeout before registering observer', () => {
    expect(SRC).toMatch(/setTimeout.*50/);
  });

  it('pre-enter state uses data-sys-rise="pre" attribute', () => {
    expect(SRC).toMatch(/data-sys-rise.*pre/);
  });

  it('entered state uses data-sys-enter="rise" attribute', () => {
    expect(SRC).toMatch(/data-sys-enter.*rise/);
  });

  it('stagger delay applied via --rise-delay CSS custom property', () => {
    expect(SRC).toMatch(/--rise-delay/);
  });

  it('SSR-safe: guards observer creation behind typeof window', () => {
    expect(SRC).toMatch(/typeof window/);
  });

  it('cleanup: clears mount timer + removes from observer on unmount', () => {
    expect(SRC).toMatch(/clearTimeout/);
    expect(SRC).toMatch(/unobserve/);
  });
});

// ─── Stagger formula ──────────────────────────────────────────────────────────

describe('riseDelay(index) — stagger formula', () => {
  it('card 0 rises immediately (0ms delay)', () => {
    expect(riseDelay(0)).toBe(0);
  });

  it('card 1 rises at 50ms', () => {
    expect(riseDelay(1)).toBe(50);
  });

  it('card 2 rises at 100ms', () => {
    expect(riseDelay(2)).toBe(100);
  });

  it('card 3 rises at 150ms', () => {
    expect(riseDelay(3)).toBe(150);
  });

  it('card 5 rises at 250ms', () => {
    expect(riseDelay(5)).toBe(250);
  });

  it('card 6 rises at 300ms (hits cap)', () => {
    expect(riseDelay(6)).toBe(300);
  });

  it('card 10 is capped at 300ms — stagger never exceeds cap', () => {
    expect(riseDelay(10)).toBe(SCROLL_RISE_STAGGER_CAP_MS);
  });

  it('stagger step is 50ms', () => {
    expect(SCROLL_RISE_STAGGER_STEP_MS).toBe(50);
  });

  it('stagger cap is 300ms', () => {
    expect(SCROLL_RISE_STAGGER_CAP_MS).toBe(300);
  });

  it('curated row (3 cards) caps at 100ms — feels like a greeting, not a waterfall', () => {
    expect(riseDelay(0)).toBe(0);
    expect(riseDelay(1)).toBe(50);
    expect(riseDelay(2)).toBe(100);
  });

  it('stagger is monotonically non-decreasing up to the cap', () => {
    for (let i = 1; i <= 7; i++) {
      expect(riseDelay(i)).toBeGreaterThanOrEqual(riseDelay(i - 1));
    }
  });

  it('stagger is flat (all equal to cap) once the cap is reached', () => {
    const capIndex = Math.ceil(SCROLL_RISE_STAGGER_CAP_MS / SCROLL_RISE_STAGGER_STEP_MS);
    for (let i = capIndex; i <= capIndex + 5; i++) {
      expect(riseDelay(i)).toBe(SCROLL_RISE_STAGGER_CAP_MS);
    }
  });
});

// ─── Constants alignment ──────────────────────────────────────────────────────

describe('stagger constants alignment', () => {
  it('cap equals step × 6 — the 7th card is the first to be capped', () => {
    expect(SCROLL_RISE_STAGGER_CAP_MS).toBe(SCROLL_RISE_STAGGER_STEP_MS * 6);
  });

  it('both constants are positive integers', () => {
    expect(SCROLL_RISE_STAGGER_STEP_MS).toBeGreaterThan(0);
    expect(SCROLL_RISE_STAGGER_CAP_MS).toBeGreaterThan(0);
    expect(Number.isInteger(SCROLL_RISE_STAGGER_STEP_MS)).toBe(true);
    expect(Number.isInteger(SCROLL_RISE_STAGGER_CAP_MS)).toBe(true);
  });
});
