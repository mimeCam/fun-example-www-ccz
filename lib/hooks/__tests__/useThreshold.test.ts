/**
 * useThreshold tests — module-level invariants we can prove without jsdom.
 *
 * The React-hook dance itself (focus capture, effects firing) is best
 * exercised via real browser tests; what we CAN lock down here is:
 *   • the public exports exist with the right shape;
 *   • the stack-reset hatch works so other tests stay isolated;
 *   • the phase reducer is pure and handles every edge (including the
 *     rapid-toggle race that used to leak scroll-locks).
 */

import {
  THRESHOLD_OPENING_EVENT,
  __resetThresholdStackForTests,
  phaseReducer,
  useThreshold,
  type PhaseAction,
} from '../useThreshold';
import {
  BACKDROP_EXIT_DELAY_MS, CHAMBER_EXIT_MS,
} from '@/lib/utils/animation-phase';
import type { Phase } from '@/lib/utils/animation-phase';

describe('useThreshold module surface', () => {
  it('exposes the opening-event name (stable for listeners)', () => {
    expect(THRESHOLD_OPENING_EVENT).toBe('threshold:opening');
  });

  it('exposes a stack-reset hatch for tests', () => {
    expect(typeof __resetThresholdStackForTests).toBe('function');
    expect(() => __resetThresholdStackForTests()).not.toThrow();
  });

  it('exports the hook as a function (1 arg by signature)', () => {
    expect(typeof useThreshold).toBe('function');
    expect(useThreshold.length).toBe(1);
  });
});

describe('THRESHOLD_OPENING_EVENT is a valid event name', () => {
  it('uses the colon-separated convention (domain:verb)', () => {
    expect(THRESHOLD_OPENING_EVENT).toMatch(/^[a-z]+:[a-z]+$/);
  });
});

// ─── Phase reducer — pure, trivially testable ────────────────────────────

describe('phaseReducer — happy path', () => {
  it('OPEN from closed → opening', () => {
    expect(phaseReducer('closed', { type: 'OPEN' })).toBe('opening');
  });

  it('ANIMATION_END from opening → open', () => {
    expect(phaseReducer('opening', { type: 'ANIMATION_END' })).toBe('open');
  });

  it('CLOSE from open → closing (deferred unmount)', () => {
    expect(phaseReducer('open', { type: 'CLOSE' })).toBe('closing');
  });

  it('ANIMATION_END from closing → closed (portal unmount)', () => {
    expect(phaseReducer('closing', { type: 'ANIMATION_END' })).toBe('closed');
  });
});

describe('phaseReducer — idempotence guarantees', () => {
  const noChange = (from: Phase, action: PhaseAction): void => {
    expect(phaseReducer(from, action)).toBe(from);
  };

  it('OPEN while already opening is a no-op', () => {
    noChange('opening', { type: 'OPEN' });
    noChange('open', { type: 'OPEN' });
  });

  it('CLOSE while already closing/closed is a no-op', () => {
    noChange('closing', { type: 'CLOSE' });
    noChange('closed', { type: 'CLOSE' });
  });

  it('ANIMATION_END in stable states (open/closed) is a no-op', () => {
    noChange('open', { type: 'ANIMATION_END' });
    noChange('closed', { type: 'ANIMATION_END' });
  });
});

describe('phaseReducer — rapid-toggle race (Mike K. invariant)', () => {
  it('OPEN while closing cancels mid-exit (closing → opening)', () => {
    expect(phaseReducer('closing', { type: 'OPEN' })).toBe('opening');
  });

  it('CLOSE while opening short-circuits (opening → closing)', () => {
    expect(phaseReducer('opening', { type: 'CLOSE' })).toBe('closing');
  });

  it('FORCE_CLOSED is the emergency-stop from any phase', () => {
    const from: Phase[] = ['closed', 'opening', 'open', 'closing'];
    from.forEach(p => expect(phaseReducer(p, { type: 'FORCE_CLOSED' })).toBe('closed'));
  });
});

describe('phaseReducer — purity (no object mutation, no closure)', () => {
  it('returns the same phase reference when no transition applies', () => {
    const before: Phase = 'open';
    const after = phaseReducer(before, { type: 'OPEN' });
    expect(after).toBe(before);
  });

  it('never throws on unknown actions (defensive default)', () => {
    const unknown = { type: 'GARBAGE' } as unknown as PhaseAction;
    expect(() => phaseReducer('open', unknown)).not.toThrow();
    expect(phaseReducer('open', unknown)).toBe('open');
  });
});

// ─── Stagger invariant (re-assert at the call site of the hook) ──────────

describe('stagger invariant (locked alongside the reducer)', () => {
  it('0 < BACKDROP_EXIT_DELAY_MS < CHAMBER_EXIT_MS', () => {
    expect(BACKDROP_EXIT_DELAY_MS).toBeGreaterThan(0);
    expect(BACKDROP_EXIT_DELAY_MS).toBeLessThan(CHAMBER_EXIT_MS);
  });
});
