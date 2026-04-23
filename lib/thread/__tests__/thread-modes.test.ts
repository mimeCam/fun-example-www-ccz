/**
 * thread-modes — resolver + predicates are pure, so test them directly.
 *
 * Proves the one invariant subscribers will rely on: given the OS's
 * reduced-motion flag, the driver resolves to either `smooth` or `snap`
 * — never `off`. `off` is reserved for an explicit opt-out.
 *
 * Credits: Mike K. (napkin §5.4 — the three postures).
 */

import {
  DEFAULT_MODE,
  isActive,
  isSnap,
  resolveMode,
} from '../thread-modes';

describe('thread-modes — resolveMode', () => {
  it('returns smooth when reduced-motion is not set', () => {
    expect(resolveMode(false)).toBe('smooth');
  });

  it('returns snap under prefers-reduced-motion', () => {
    expect(resolveMode(true)).toBe('snap');
  });

  it('never returns off from an OS flag — off is reserved', () => {
    expect(resolveMode(false)).not.toBe('off');
    expect(resolveMode(true)).not.toBe('off');
  });
});

describe('thread-modes — predicates', () => {
  it('isActive is true for smooth and snap, false for off', () => {
    expect(isActive('smooth')).toBe(true);
    expect(isActive('snap')).toBe(true);
    expect(isActive('off')).toBe(false);
  });

  it('isSnap is true only for snap', () => {
    expect(isSnap('snap')).toBe(true);
    expect(isSnap('smooth')).toBe(false);
    expect(isSnap('off')).toBe(false);
  });
});

describe('thread-modes — default', () => {
  it('DEFAULT_MODE is smooth (the most common posture)', () => {
    expect(DEFAULT_MODE).toBe('smooth');
  });
});
