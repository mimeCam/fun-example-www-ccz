/**
 * useLoopFunnel — emitter discipline (no React, no jsdom).
 *
 * The hook itself wires lifecycle listeners — covered separately in the
 * article-page integration. This suite locks the *invariants* that callers
 * (clipboard, mirror, thread depth, keepsake) depend on:
 *   1. SSR-safe — emitting without `window` is a silent no-op.
 *   2. No-op without an article context (e.g. on /mirror, /resonances).
 *   3. Idempotent per (article, checkpoint) pair within a session.
 *   4. Beacon transport is preferred when available; falls back to fetch.
 *   5. Each successful emit attempts exactly one transport call.
 */

import { CHECKPOINTS } from '@/lib/engagement/loop-funnel';

type SendBeacon = (url: string, data?: BodyInit | null) => boolean;
interface Recorder { beacon: jest.Mock<boolean, [string, BodyInit?]>; fetch: jest.Mock; }

function loadModule() {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/hooks/useLoopFunnel') as
    typeof import('@/lib/hooks/useLoopFunnel');
}

function makeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
  };
}

function installBrowserEnv(): Recorder {
  const beacon = jest.fn<boolean, [string, BodyInit?]>(() => true);
  const fetchMock = jest.fn(() => Promise.resolve({ ok: true } as Response));
  (globalThis as { window?: unknown }).window = {
    sessionStorage: makeStorage(),
    addEventListener: () => {}, removeEventListener: () => {},
  };
  (globalThis as { navigator?: unknown }).navigator = {
    sendBeacon: beacon as unknown as SendBeacon,
  };
  (globalThis as { fetch?: unknown }).fetch = fetchMock;
  return { beacon, fetch: fetchMock };
}

function teardownBrowserEnv(): void {
  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { navigator?: unknown }).navigator;
  delete (globalThis as { fetch?: unknown }).fetch;
}

async function flushTimers(): Promise<void> {
  jest.advanceTimersByTime(500);
  await Promise.resolve();
}

beforeEach(() => { jest.useFakeTimers(); });
afterEach(() => {
  jest.useRealTimers();
  teardownBrowserEnv();
});

describe('emitCheckpoint — guards', () => {
  it('SSR no-op — no window means no transport call', () => {
    const recorder: Recorder = { beacon: jest.fn(), fetch: jest.fn() };
    const mod = loadModule();
    mod.__resetLoopFunnelForTests();
    mod.emitCheckpoint(CHECKPOINTS.RESOLVED);
    expect(recorder.beacon).not.toHaveBeenCalled();
    expect(recorder.fetch).not.toHaveBeenCalled();
  });

  it('no-op when no article context is registered', async () => {
    const recorder = installBrowserEnv();
    const mod = loadModule();
    mod.__resetLoopFunnelForTests();
    mod.emitCheckpoint(CHECKPOINTS.RESOLVED);
    await flushTimers();
    expect(recorder.beacon).not.toHaveBeenCalled();
    expect(recorder.fetch).not.toHaveBeenCalled();
    expect(mod.__peekQueueForTests().length).toBe(0);
  });
});

describe('emitCheckpoint — idempotency', () => {
  it('three emits of the same checkpoint result in one beacon call', async () => {
    const recorder = installBrowserEnv();
    const mod = loadModule();
    mod.__resetLoopFunnelForTests();
    mod.__setArticleContextForTests('article-x', 'deep-diver');
    mod.emitCheckpoint(CHECKPOINTS.RESOLVED);
    mod.emitCheckpoint(CHECKPOINTS.RESOLVED);
    mod.emitCheckpoint(CHECKPOINTS.RESOLVED);
    await flushTimers();
    expect(recorder.beacon).toHaveBeenCalledTimes(1);
  });

  it('different checkpoints on the same article each ship once', async () => {
    const recorder = installBrowserEnv();
    const mod = loadModule();
    mod.__resetLoopFunnelForTests();
    mod.__setArticleContextForTests('article-x', 'deep-diver');
    mod.emitCheckpoint(CHECKPOINTS.RESOLVED);
    mod.emitCheckpoint(CHECKPOINTS.WARMED);
    mod.emitCheckpoint(CHECKPOINTS.SHARED);
    await flushTimers();
    expect(recorder.beacon).toHaveBeenCalledTimes(3);
  });
});

describe('emitCheckpoint — transport selection', () => {
  it('uses sendBeacon when available and successful', async () => {
    const recorder = installBrowserEnv();
    const mod = loadModule();
    mod.__resetLoopFunnelForTests();
    mod.__setArticleContextForTests('article-x', 'deep-diver');
    mod.emitCheckpoint(CHECKPOINTS.RESOLVED);
    await flushTimers();
    expect(recorder.beacon).toHaveBeenCalledTimes(1);
    expect(recorder.fetch).not.toHaveBeenCalled();
    expect(recorder.beacon.mock.calls[0][0]).toBe('/api/loop/checkpoint');
  });

  it('falls back to fetch with keepalive when sendBeacon returns false', async () => {
    const recorder = installBrowserEnv();
    recorder.beacon.mockReturnValue(false);
    const mod = loadModule();
    mod.__resetLoopFunnelForTests();
    mod.__setArticleContextForTests('article-x', 'deep-diver');
    mod.emitCheckpoint(CHECKPOINTS.WARMED);
    await flushTimers();
    expect(recorder.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = recorder.fetch.mock.calls[0];
    expect(url).toBe('/api/loop/checkpoint');
    expect((init as RequestInit).keepalive).toBe(true);
    expect((init as RequestInit).method).toBe('POST');
  });
});

describe('payload shape', () => {
  it('includes sessionId, articleId, checkpoint, and the resolved archetype', async () => {
    const recorder = installBrowserEnv();
    const mod = loadModule();
    mod.__resetLoopFunnelForTests();
    mod.__setArticleContextForTests('article-x', 'reflective-mirror');
    mod.emitCheckpoint(CHECKPOINTS.KEEPSAKED);
    await flushTimers();
    const blob = recorder.beacon.mock.calls[0][1] as Blob;
    const text = await (blob as { text: () => Promise<string> }).text();
    const payload = JSON.parse(text);
    expect(payload.articleId).toBe('article-x');
    expect(payload.checkpoint).toBe('keepsaked');
    expect(payload.archetype).toBe('reflective-mirror');
    expect(typeof payload.sessionId).toBe('string');
    expect(payload.sessionId.length).toBeGreaterThan(0);
  });
});
