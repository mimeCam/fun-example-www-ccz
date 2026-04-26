/**
 * quiet-store — unit tests for the ceremony-quiet pub/sub.
 *
 * The store is a `Set<Listener>` singleton with one slot; these tests lock
 * down the four invariants that the consumers (`useCeremonyQuiet`,
 * `onCrossing`, `<ToastHost>`) depend on:
 *
 *   1. `getCeremonyQuiet()` defaults to `false` (SSR-safe baseline).
 *   2. `setCeremonyQuiet(true)` flips the slot and notifies subscribers.
 *   3. Idempotent writes (same value twice) do NOT fan out — preserves the
 *      `useSyncExternalStore` re-render budget.
 *   4. Subscribers can unsubscribe mid-fan-out without crashing the loop
 *      (snapshot semantics — same shape as `lib/sharing/toast-store.ts`).
 *
 * One file. Five describes. Pure node — no jsdom, no React.
 *
 * Credits: Mike K. (napkin §3 — store pattern lifted from toast-store),
 * Tanya D. (UX §5 — gate-at-host architecture this store enables).
 */

import {
  setCeremonyQuiet,
  subscribeCeremonyQuiet,
  getCeremonyQuiet,
  getCeremonyQuietServerSnapshot,
  __resetCeremonyQuietForTest,
} from '../quiet-store';

beforeEach(() => __resetCeremonyQuietForTest());

// ─── Default state ─────────────────────────────────────────────────────────

describe('quiet-store — default state', () => {
  it('starts with quiet=false (room is not gifting yet)', () => {
    expect(getCeremonyQuiet()).toBe(false);
  });

  it('server snapshot is always false (SSR baseline never suppresses)', () => {
    expect(getCeremonyQuietServerSnapshot()).toBe(false);
  });
});

// ─── Single-write semantics ────────────────────────────────────────────────

describe('quiet-store — set + read', () => {
  it('setCeremonyQuiet(true) flips the slot to true', () => {
    setCeremonyQuiet(true);
    expect(getCeremonyQuiet()).toBe(true);
  });

  it('setCeremonyQuiet(false) flips the slot back to false', () => {
    setCeremonyQuiet(true);
    setCeremonyQuiet(false);
    expect(getCeremonyQuiet()).toBe(false);
  });
});

// ─── Subscriber notifications ──────────────────────────────────────────────

describe('quiet-store — subscriber notifications', () => {
  it('notifies subscribers when value changes', () => {
    const listener = jest.fn();
    subscribeCeremonyQuiet(listener);
    setCeremonyQuiet(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does NOT notify subscribers on idempotent writes (same value)', () => {
    const listener = jest.fn();
    subscribeCeremonyQuiet(listener);
    setCeremonyQuiet(false); // store starts at false; same value → no fan-out
    expect(listener).not.toHaveBeenCalled();
  });

  it('notifies once per real transition (true→false→true → 3 calls)', () => {
    const listener = jest.fn();
    subscribeCeremonyQuiet(listener);
    setCeremonyQuiet(true);
    setCeremonyQuiet(false);
    setCeremonyQuiet(true);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('returns an unsubscribe fn that detaches the listener', () => {
    const listener = jest.fn();
    const off = subscribeCeremonyQuiet(listener);
    off();
    setCeremonyQuiet(true);
    expect(listener).not.toHaveBeenCalled();
  });
});

// ─── Mid-fan-out unsubscribe (snapshot semantics) ──────────────────────────

describe('quiet-store — mid-fan-out unsubscribe is safe', () => {
  it('a listener that unsubscribes during fan-out does not crash the loop', () => {
    const otherListener = jest.fn();
    const offSelf = jest.fn();
    const selfListener = jest.fn(() => offSelf());
    subscribeCeremonyQuiet(otherListener);
    const off = subscribeCeremonyQuiet(() => { selfListener(); off(); });
    setCeremonyQuiet(true);
    expect(selfListener).toHaveBeenCalledTimes(1);
    expect(otherListener).toHaveBeenCalledTimes(1);
  });
});

// ─── Reset hatch (test-only) ───────────────────────────────────────────────

describe('quiet-store — __resetCeremonyQuietForTest', () => {
  it('clears the slot back to false', () => {
    setCeremonyQuiet(true);
    __resetCeremonyQuietForTest();
    expect(getCeremonyQuiet()).toBe(false);
  });

  it('clears the listener set so prior subscribers are detached', () => {
    const listener = jest.fn();
    subscribeCeremonyQuiet(listener);
    __resetCeremonyQuietForTest();
    setCeremonyQuiet(true);
    expect(listener).not.toHaveBeenCalled();
  });
});
