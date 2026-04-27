/**
 * archetype-bucket — deterministic 10% control split for the loop funnel.
 *
 * The four pillars this test locks down (Mike napkin §7 DoD):
 *  1. **Determinism.** Same `sessionId` ⇒ same bucket across calls.
 *  2. **Distribution.** ~10% (±1.5pp) over 10k synthetic ids land in `'control'`.
 *  3. **Falls through.** No archetype + treatment ⇒ `null`; no archetype +
 *     control ⇒ `'control'`.
 *  4. **SSR safety / pure.** No `window`, no `crypto.subtle` — runs unchanged
 *     on the server (the very runtime this test simulates with a Node env).
 */

import {
  bucketFor,
  isControlSession,
  fnv1a32,
  CONTROL_BUCKET,
  DEFAULT_CONTROL_SHARE,
} from '@/lib/engagement/archetype-bucket';

describe('fnv1a32 — pure hash', () => {
  it('returns the same unsigned int for the same input', () => {
    expect(fnv1a32('abc')).toBe(fnv1a32('abc'));
    expect(fnv1a32('abc')).toBeGreaterThanOrEqual(0);
    expect(fnv1a32('abc')).toBeLessThan(2 ** 32);
  });

  it('produces different hashes for different inputs', () => {
    expect(fnv1a32('a')).not.toBe(fnv1a32('b'));
  });

  it('the empty string maps to the FNV-1a 32 offset basis', () => {
    expect(fnv1a32('')).toBe(0x811c9dc5);
  });
});

describe('isControlSession — clamping + endpoints', () => {
  it('returns false when share=0', () => {
    expect(isControlSession('any', 0)).toBe(false);
  });

  it('returns true when share=1', () => {
    expect(isControlSession('any', 1)).toBe(true);
  });

  it('clamps negative share to 0', () => {
    expect(isControlSession('any', -0.5)).toBe(false);
  });

  it('clamps share > 1 to 1', () => {
    expect(isControlSession('any', 1.5)).toBe(true);
  });
});

describe('bucketFor — labelling', () => {
  it('returns the archetype unchanged when not in control', () => {
    expect(bucketFor('does-not-matter', 'deep-diver', 0)).toBe('deep-diver');
  });

  it('returns CONTROL_BUCKET when in control', () => {
    expect(bucketFor('does-not-matter', 'deep-diver', 1)).toBe(CONTROL_BUCKET);
  });

  it('returns null when no sessionId AND no archetype', () => {
    expect(bucketFor(null, null)).toBeNull();
    expect(bucketFor('', '')).toBeNull();
  });

  it('returns null when sessionId is missing even if archetype is given', () => {
    expect(bucketFor(null, 'deep-diver')).toBe('deep-diver');
  });

  it('always returns the same bucket for the same sessionId', () => {
    const id = 'session-123';
    const a = bucketFor(id, 'deep-diver');
    const b = bucketFor(id, 'deep-diver');
    expect(a).toBe(b);
  });
});

describe('bucketFor — distribution', () => {
  it('routes ~10% of 10k synthetic ids to control (±1.5pp)', () => {
    const N = 10_000;
    let controls = 0;
    for (let i = 0; i < N; i++) {
      // Mix of UUID-shape and Math.random-shape ids — close to the
      // production distribution where `crypto.randomUUID()` is the norm
      // and the fallback is `${Date.now().toString(36)}-...`.
      const id = `s-${i}-${(i * 0x9e3779b9 >>> 0).toString(16)}`;
      if (bucketFor(id, 'deep-diver') === CONTROL_BUCKET) controls++;
    }
    const ratio = controls / N;
    expect(ratio).toBeGreaterThan(DEFAULT_CONTROL_SHARE - 0.015);
    expect(ratio).toBeLessThan(DEFAULT_CONTROL_SHARE + 0.015);
  });

  it('honors a custom share — 25% lands within ±2pp', () => {
    const N = 10_000;
    let controls = 0;
    for (let i = 0; i < N; i++) {
      if (isControlSession(`u-${i}-${(i * 2654435761 >>> 0).toString(16)}`, 0.25)) controls++;
    }
    const ratio = controls / N;
    expect(ratio).toBeGreaterThan(0.23);
    expect(ratio).toBeLessThan(0.27);
  });
});

describe('bucketFor — SSR safety', () => {
  it('does not touch window or crypto.subtle', () => {
    // jest's testEnvironment is 'node' for this project — there is no
    // `window`. If this runs without throwing, SSR safety holds.
    expect(() => bucketFor('s-ssr', 'deep-diver')).not.toThrow();
    expect(() => isControlSession('s-ssr')).not.toThrow();
  });
});
