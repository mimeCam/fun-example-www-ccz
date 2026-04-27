/**
 * useReducedMotion — module-level invariants we can prove without jsdom.
 *
 * The React-hook dance itself (mount, effect-fires, listener-attaches) is
 * best exercised by a real browser. What we CAN lock here, pure and node-
 * only, is the **subscription contract** that the hook is just glue on top
 * of:
 *
 *   1. The literal media-query string is `(prefers-reduced-motion: reduce)`
 *      — a future refactor cannot silently drift the query.
 *   2. SSR-safe: when `window` is undefined the subscriber returns
 *      `undefined` and never reads `setReduced`.
 *   3. SSR-safe: when `window.matchMedia` is missing (older runtime) the
 *      subscriber early-returns; the consumer keeps the SSR default.
 *   4. The subscriber pushes the initial `mql.matches` once at attach time,
 *      then forwards the `change` event's `e.matches`.
 *   5. The subscriber returns a cleanup that detaches the same listener.
 *
 * Pure module test — we exercise the exported `subscribe` helper directly
 * (the hook's only side-effect carrier) under a hand-rolled MediaQueryList
 * fake. Each `it` ≤ 10 LoC by construction (Sid invariant).
 *
 * Credits: Mike K. (architect napkin #88 §5.3 — the SSR-safe shape, the
 * "default false on the server, live-updating on the client" framing),
 * Tanya D. (UIX #97 §0 — "the user with reduced motion turned on must
 * finally feel held by it" — the reason this hook exists), prior art:
 * the private `usePrefersReducedMotion` shape inside `useKeepsakePreview.ts`.
 */

import { __testing__, useReducedMotion } from '../useReducedMotion';

const { REDUCED_MOTION_QUERY, subscribe } = __testing__;

// ─── Tiny fake MediaQueryList — pure object, no jsdom ─────────────────────

interface FakeMQL {
  matches: boolean;
  addEventListener: (t: 'change', l: (e: MediaQueryListEvent) => void) => void;
  removeEventListener: (t: 'change', l: (e: MediaQueryListEvent) => void) => void;
  fire: (next: boolean) => void;
}

function makeFakeMql(initial: boolean): FakeMQL {
  let listener: ((e: MediaQueryListEvent) => void) | null = null;
  return {
    matches: initial,
    addEventListener: (_t, l) => { listener = l; },
    removeEventListener: (_t, l) => { if (listener === l) listener = null; },
    fire: (next) => listener?.({ matches: next } as MediaQueryListEvent),
  };
}

// ─── Module surface ───────────────────────────────────────────────────────

describe('useReducedMotion — module surface', () => {
  it('exports the hook as a function with no required args', () => {
    expect(typeof useReducedMotion).toBe('function');
    expect(useReducedMotion.length).toBe(0);
  });

  it('subscribes to the canonical media-query string', () => {
    expect(REDUCED_MOTION_QUERY).toBe('(prefers-reduced-motion: reduce)');
  });

  it("the query string carries no shorthand (no 'reduced', no 'no-preference')", () => {
    expect(REDUCED_MOTION_QUERY).not.toMatch(/no-preference/);
    expect(REDUCED_MOTION_QUERY).toMatch(/^\(prefers-reduced-motion: reduce\)$/);
  });
});

// ─── Subscriber — SSR safety ──────────────────────────────────────────────

describe('subscribe — SSR-safe early returns', () => {
  const realWin = (globalThis as { window?: unknown }).window;
  afterEach(() => { (globalThis as { window?: unknown }).window = realWin; });

  it('returns undefined when window is missing (server render)', () => {
    delete (globalThis as { window?: unknown }).window;
    const cleanup = subscribe(() => fail('setter must not fire on server'));
    expect(cleanup).toBeUndefined();
  });

  it('returns undefined when matchMedia is unavailable (legacy runtime)', () => {
    (globalThis as { window?: unknown }).window = {} as unknown;
    const cleanup = subscribe(() => fail('setter must not fire without matchMedia'));
    expect(cleanup).toBeUndefined();
  });
});

// ─── Subscriber — happy path (attach, push, change, detach) ───────────────

describe('subscribe — push-then-update protocol', () => {
  const realWin = (globalThis as { window?: unknown }).window;
  afterEach(() => { (globalThis as { window?: unknown }).window = realWin; });

  function withFakeWindow(mql: FakeMQL): void {
    (globalThis as { window?: unknown }).window = {
      matchMedia: (q: string) => { expect(q).toBe(REDUCED_MOTION_QUERY); return mql; },
    };
  }

  it('pushes the initial matches=false at attach time', () => {
    const mql = makeFakeMql(false);
    withFakeWindow(mql);
    const calls: boolean[] = [];
    subscribe((b) => calls.push(b));
    expect(calls).toEqual([false]);
  });

  it('pushes the initial matches=true at attach time', () => {
    const mql = makeFakeMql(true);
    withFakeWindow(mql);
    const calls: boolean[] = [];
    subscribe((b) => calls.push(b));
    expect(calls).toEqual([true]);
  });

  it("forwards the `change` event's `matches`", () => {
    const mql = makeFakeMql(false);
    withFakeWindow(mql);
    const calls: boolean[] = [];
    subscribe((b) => calls.push(b));
    mql.fire(true);
    mql.fire(false);
    expect(calls).toEqual([false, true, false]);
  });

  it('returns a cleanup that detaches the listener (no further pushes)', () => {
    const mql = makeFakeMql(false);
    withFakeWindow(mql);
    const calls: boolean[] = [];
    const cleanup = subscribe((b) => calls.push(b));
    cleanup?.();
    mql.fire(true);
    expect(calls).toEqual([false]);
  });
});
