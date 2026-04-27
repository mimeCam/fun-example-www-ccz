/**
 * useRecognitionPhase — chain-walker discipline pin.
 *
 * The hook itself is a thin React adapter — its load-bearing logic is the
 * pure `walkTimeline(timeline, setter)` chain that schedules one
 * `setTimeout` per phase transition and cleans up the pending step on
 * unmount. This test exercises that pure helper directly via the
 * `__testing__` seam (mirrors `useReducedMotion.__testing__.subscribe`)
 * with Jest fake timers — no jsdom, no React renderer.
 *
 * What this pin enforces (Mike napkin §"Module shape" #2):
 *
 *   §1 · STEPS-OF — `stepsOf(timeline)` produces (delay, phase) tuples
 *        for the four transitions (rest→lift, lift→settle, settle→hold,
 *        hold→fold). Length and shape are pinned.
 *
 *   §2 · CHAIN ADVANCES — under fake timers, walking the chain emits
 *        each phase exactly once, in order. The setter is called with
 *        `'lift' → 'settle' → 'hold' → 'fold'`.
 *
 *   §3 · CLEANUP CANCELS THE PENDING STEP — calling the cleanup before
 *        the chain completes prevents subsequent setter calls.
 *
 *   §4 · ZERO-DURATION TIMELINE LANDS AT FOLD IN ONE TICK — the silent
 *        plan does not idle at `'rest'` forever; it short-circuits.
 *
 * Pure module under test. `node` test environment (no DOM access in the
 * pure helper). ≤ 10 LoC per helper.
 *
 * Credits: Mike K. (architect napkin §"Module shape" #2 — single-effect /
 * single-chain / cleanup discipline this test pins), Sid (chain helper
 * carved out of the hook so the test does not need a renderer).
 */

import {
  letterTimeline, whisperTimeline, silentTimeline,
  type RecognitionPhase,
} from '@/lib/return/recognition-timeline';
import { __testing__ as HookTesting } from '@/lib/hooks/useRecognitionPhase';

const { walkTimeline, stepsOf } = HookTesting;

// ─── §1 · stepsOf shape ───────────────────────────────────────────────────

describe('useRecognitionPhase · §1 stepsOf produces four transitions', () => {
  it('letter timeline yields four (delay, phase) tuples', () => {
    const steps = stepsOf(letterTimeline());
    expect(steps).toHaveLength(4);
  });

  it('the four target phases are lift, settle, hold, fold (in order)', () => {
    const steps = stepsOf(letterTimeline());
    expect(steps.map(([, p]) => p)).toEqual(['lift', 'settle', 'hold', 'fold']);
  });

  it('the four delays mirror the timeline fields (lift, settle, hold, fold)', () => {
    const t = letterTimeline();
    const steps = stepsOf(t);
    expect(steps.map(([d]) => d)).toEqual([t.liftMs, t.settleMs, t.holdMs, t.foldMs]);
  });
});

// ─── §2 · The chain advances under fake timers ────────────────────────────

describe('useRecognitionPhase · §2 walkTimeline advances through every phase', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('letter walk emits lift → settle → hold → fold via the setter', () => {
    const seen: RecognitionPhase[] = [];
    const cleanup = walkTimeline(letterTimeline(), (p) => seen.push(p));
    jest.runAllTimers();
    cleanup();
    expect(seen).toEqual(['lift', 'settle', 'hold', 'fold']);
  });

  it('whisper walk emits the same four transitions in the same order', () => {
    const seen: RecognitionPhase[] = [];
    const cleanup = walkTimeline(whisperTimeline(), (p) => seen.push(p));
    jest.runAllTimers();
    cleanup();
    expect(seen).toEqual(['lift', 'settle', 'hold', 'fold']);
  });
});

// ─── §3 · Cleanup cancels the pending step ────────────────────────────────

describe('useRecognitionPhase · §3 cleanup cancels the pending chain', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('cleanup before any timer fires → setter never called', () => {
    const seen: RecognitionPhase[] = [];
    const cleanup = walkTimeline(letterTimeline(), (p) => seen.push(p));
    cleanup();
    jest.runAllTimers();
    expect(seen).toEqual([]);
  });

  it('cleanup after the first step → no further phases emit', () => {
    const seen: RecognitionPhase[] = [];
    const cleanup = walkTimeline(letterTimeline(), (p) => seen.push(p));
    jest.advanceTimersByTime(letterTimeline().liftMs);
    cleanup();
    jest.runAllTimers();
    expect(seen).toEqual(['lift']);
  });
});

// ─── §4 · Zero-duration timeline short-circuits to fold ───────────────────

describe('useRecognitionPhase · §4 silent timeline short-circuits to fold', () => {
  it('silent walk lands at fold synchronously (no idle at rest)', () => {
    const seen: RecognitionPhase[] = [];
    const cleanup = walkTimeline(silentTimeline(), (p) => seen.push(p));
    cleanup();
    expect(seen).toEqual(['fold']);
  });
});
