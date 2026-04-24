/**
 * prefers-contrast unit — probe + subscription semantics.
 *
 * Covers three cases the hook/probe pair must preserve forever:
 *   1. SSR (no window) → `readPrefersContrast` returns `false` (hydration-safe).
 *   2. `matchMedia` change event flips the subscription callback.
 *   3. Unsubscribe removes the underlying listener (no leaks across tests).
 *
 * We intentionally do NOT drive the React hook here — the project ships
 * Jest without `@testing-library/react` wired into the node runtime (see
 * `jest.config.js`). The hook is a three-liner that composes the two
 * functions exercised below; testing those closes the physics.
 *
 * Credits: Mike K. (napkin #5 — three hook cases), Tanya D. (§2 — one
 * posture, one probe), reduced-motion.ts (the sibling shape we echo).
 */

import {
  PREFERS_CONTRAST_QUERY,
  readPrefersContrast,
  subscribePrefersContrast,
} from '../prefers-contrast';

// ─── Tiny matchMedia harness — one listener store, synchronous events ────

interface FakeMql {
  matches: boolean;
  listeners: Set<(e: MediaQueryListEvent) => void>;
  addEventListener(type: 'change', cb: (e: MediaQueryListEvent) => void): void;
  removeEventListener(type: 'change', cb: (e: MediaQueryListEvent) => void): void;
  fire(matches: boolean): void;
}

function makeFakeMql(initial: boolean): FakeMql {
  const mql: FakeMql = {
    matches: initial,
    listeners: new Set(),
    addEventListener(_t, cb) { this.listeners.add(cb); },
    removeEventListener(_t, cb) { this.listeners.delete(cb); },
    fire(matches) {
      this.matches = matches;
      this.listeners.forEach((cb) => cb({ matches } as MediaQueryListEvent));
    },
  };
  return mql;
}

function installWindow(mql: FakeMql): void {
  (globalThis as any).window = {
    matchMedia: (q: string) => {
      expect(q).toBe(PREFERS_CONTRAST_QUERY);
      return mql;
    },
  };
}

function uninstallWindow(): void {
  delete (globalThis as any).window;
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('PREFERS_CONTRAST_QUERY is the canonical string', () => {
  it('reads `(prefers-contrast: more)` verbatim', () => {
    expect(PREFERS_CONTRAST_QUERY).toBe('(prefers-contrast: more)');
  });
});

describe('readPrefersContrast — SSR safety + client truth', () => {
  afterEach(uninstallWindow);

  it('returns false when window is undefined (SSR)', () => {
    uninstallWindow();
    expect(readPrefersContrast()).toBe(false);
  });

  it('returns the matchMedia match on the client', () => {
    installWindow(makeFakeMql(true));
    expect(readPrefersContrast()).toBe(true);
  });

  it('returns false when the OS flag is off', () => {
    installWindow(makeFakeMql(false));
    expect(readPrefersContrast()).toBe(false);
  });
});

describe('subscribePrefersContrast — change events and teardown', () => {
  afterEach(uninstallWindow);

  it('invokes the callback with the new value on change', () => {
    const mql = makeFakeMql(false);
    installWindow(mql);
    const cb = jest.fn();
    subscribePrefersContrast(cb);
    mql.fire(true);
    expect(cb).toHaveBeenCalledWith(true);
  });

  it('unsubscribe removes the underlying listener', () => {
    const mql = makeFakeMql(false);
    installWindow(mql);
    const cb = jest.fn();
    const off = subscribePrefersContrast(cb);
    off();
    mql.fire(true);
    expect(cb).not.toHaveBeenCalled();
  });

  it('supports multiple subscribers independently', () => {
    const mql = makeFakeMql(false);
    installWindow(mql);
    const a = jest.fn();
    const b = jest.fn();
    const offA = subscribePrefersContrast(a);
    subscribePrefersContrast(b);
    offA();
    mql.fire(true);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledWith(true);
  });
});
