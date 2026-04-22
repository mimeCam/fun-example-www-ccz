/**
 * useThreshold tests — module-level invariants we can prove without jsdom.
 *
 * The React-hook dance itself (focus capture, effects firing) is best
 * exercised via real browser tests; what we CAN lock down here is that
 * the public exports exist with the right shape and that the stack-reset
 * hatch works so other tests stay isolated.
 */

import {
  THRESHOLD_OPENING_EVENT,
  __resetThresholdStackForTests,
  useThreshold,
} from '../useThreshold';

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
