/**
 * thread-driver — singleton pub/sub with a RAF loop and a passive scroll
 * tap. We test the pieces that don't need a live browser:
 *
 *   - module shape (subscribe / peek / Unsubscribe);
 *   - subscribe/unsubscribe ref-counting wiring (listener attach/detach);
 *   - synchronous replay-on-subscribe (new subscribers don't paint 0);
 *   - cleanup (no dangling listeners, no leftover subscribers).
 *
 * Tests run in node; we install light mocks for `window`/`document` and
 * the RAF scheduler so the driver can run a few ticks against a known
 * viewport without pulling in JSDOM.
 *
 * Credits: Mike K. (napkin §5.1 — "one RAF, not one-per-component";
 * §5.8 — polymorphism = killer, every subscriber is the same shape).
 */

// ─── Minimal browser shim (node jest env) ──────────────────────────────────

interface ShimHandles {
  listeners: Map<string, Set<EventListener>>;
  win: any;
  doc: any;
  advance(frames?: number, stepMs?: number): void;
  fireScroll(): void;
}

function installBrowserShim(): ShimHandles {
  const listeners = new Map<string, Set<EventListener>>();
  let now = 0;
  let rafQueue: Array<(t: number) => void> = [];
  const win: any = {
    scrollY: 0,
    innerHeight: 800,
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    addEventListener: (t: string, l: EventListener) => {
      if (!listeners.has(t)) listeners.set(t, new Set());
      listeners.get(t)!.add(l);
    },
    removeEventListener: (t: string, l: EventListener) => { listeners.get(t)?.delete(l); },
    requestAnimationFrame: (cb: (t: number) => void) => { rafQueue.push(cb); return rafQueue.length; },
    cancelAnimationFrame: () => { rafQueue = []; },
  };
  const doc: any = {
    documentElement: { scrollHeight: 2400, style: { setProperty: () => {} } },
  };
  (globalThis as any).window = win;
  (globalThis as any).document = doc;
  (globalThis as any).requestAnimationFrame = win.requestAnimationFrame;
  (globalThis as any).cancelAnimationFrame = win.cancelAnimationFrame;
  return {
    listeners, win, doc,
    advance(frames = 1, stepMs = 16.67) {
      for (let i = 0; i < frames; i++) {
        now += stepMs;
        const q = rafQueue; rafQueue = [];
        q.forEach((cb) => cb(now));
      }
    },
    fireScroll() { listeners.get('scroll')?.forEach((l) => l(new Event('scroll'))); },
  };
}

function teardownBrowserShim(): void {
  delete (globalThis as any).window;
  delete (globalThis as any).document;
  delete (globalThis as any).requestAnimationFrame;
  delete (globalThis as any).cancelAnimationFrame;
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('thread-driver — module shape', () => {
  let shim: ShimHandles;
  beforeEach(() => { shim = installBrowserShim(); });
  afterEach(() => {
    const mod = require('../thread-driver');
    mod.__resetDriverForTests();
    teardownBrowserShim();
    jest.resetModules();
  });

  it('exports subscribe, peek, and test reset hook', () => {
    const mod = require('../thread-driver');
    expect(typeof mod.subscribe).toBe('function');
    expect(typeof mod.peek).toBe('function');
    expect(typeof mod.__resetDriverForTests).toBe('function');
  });

  it('peek() returns a stable ThreadState shape', () => {
    const { peek } = require('../thread-driver');
    const s = peek();
    expect(s).toHaveProperty('depth');
    expect(s).toHaveProperty('velocity');
    expect(s).toHaveProperty('mode');
  });
});

describe('thread-driver — subscribe / unsubscribe ref-counting', () => {
  let shim: ShimHandles;
  beforeEach(() => { shim = installBrowserShim(); });
  afterEach(() => {
    const mod = require('../thread-driver');
    mod.__resetDriverForTests();
    teardownBrowserShim();
    jest.resetModules();
  });

  it('first subscribe attaches scroll/resize listeners; last unsubscribe detaches', () => {
    const { subscribe, __subscriberCountForTests } = require('../thread-driver');
    const unsub = subscribe(() => {});
    expect(__subscriberCountForTests()).toBe(1);
    expect(shim.listeners.get('scroll')?.size).toBeGreaterThan(0);
    expect(shim.listeners.get('resize')?.size).toBeGreaterThan(0);
    unsub();
    expect(__subscriberCountForTests()).toBe(0);
    expect(shim.listeners.get('scroll')?.size ?? 0).toBe(0);
    expect(shim.listeners.get('resize')?.size ?? 0).toBe(0);
  });

  it('publishes the latest snapshot synchronously on subscribe', () => {
    const { subscribe } = require('../thread-driver');
    const seen: Array<{ depth: number }> = [];
    const unsub = subscribe((s: { depth: number }) => seen.push(s));
    expect(seen.length).toBe(1);
    unsub();
  });

  it('supports N subscribers sharing one RAF budget (polymorphism contract)', () => {
    const { subscribe, __subscriberCountForTests } = require('../thread-driver');
    const a = subscribe(() => {});
    const b = subscribe(() => {});
    const c = subscribe(() => {});
    expect(__subscriberCountForTests()).toBe(3);
    a(); b(); c();
    expect(__subscriberCountForTests()).toBe(0);
  });

  it('unsubscribe is idempotent (safe to call twice)', () => {
    const { subscribe, __subscriberCountForTests } = require('../thread-driver');
    const unsub = subscribe(() => {});
    unsub(); unsub();
    expect(__subscriberCountForTests()).toBe(0);
  });
});

describe('thread-driver — RAF loop broadcasts depth to all subscribers', () => {
  let shim: ShimHandles;
  beforeEach(() => { shim = installBrowserShim(); });
  afterEach(() => {
    const mod = require('../thread-driver');
    mod.__resetDriverForTests();
    teardownBrowserShim();
    jest.resetModules();
  });

  it('drives display depth toward the normalized scroll target', () => {
    const { subscribe } = require('../thread-driver');
    const ticks: number[] = [];
    const unsub = subscribe((s: { depth: number }) => ticks.push(s.depth));
    // scrollY=1600 / (scrollHeight 2400 - innerHeight 800 = 1600) ⇒ target 1.0
    shim.win.scrollY = 1600;
    shim.fireScroll();
    shim.advance(60);
    const last = ticks[ticks.length - 1];
    expect(last).toBeGreaterThan(0.5); // has moved well past the initial 0
    expect(last).toBeLessThanOrEqual(1.0);
    unsub();
  });

  it('broadcasts each tick to every subscriber (one publisher, many consumers)', () => {
    const { subscribe } = require('../thread-driver');
    const a: number[] = []; const b: number[] = [];
    const ua = subscribe((s: { depth: number }) => a.push(s.depth));
    const ub = subscribe((s: { depth: number }) => b.push(s.depth));
    shim.win.scrollY = 800;
    shim.fireScroll();
    shim.advance(10);
    expect(a.length).toBe(b.length);
    expect(a.length).toBeGreaterThan(1);
    ua(); ub();
  });
});
