/**
 * clipboard-utils — default phrases flow through `replyPhrase`.
 *
 * The PR delta: pure-TS callers stopped shipping hardcoded English and
 * route their default success/failure messages through the lexicon.
 * This suite locks two things:
 *   1. With a reflective archetype stored, `copyWithFeedback` emits the
 *      reflective phrase on success — "Link copied, quietly.".
 *   2. Explicit `successMessage` overrides (ThreadKeepsake's poetic copy)
 *      still win — we only changed the *default* path.
 *
 * The clipboard API itself is stubbed; we only care about the toast-store
 * outcome, not whether the browser actually wrote anything.
 */

import {
  __resetToastStoreForTest, getCurrentToast,
} from '@/lib/sharing/toast-store';

function loadClipboard() {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/sharing/clipboard-utils') as
    typeof import('@/lib/sharing/clipboard-utils');
}

function loadToastStore() {
  // Same instance the clipboard module just loaded — jest.resetModules()
  // was called in loadClipboard(); don't reset again here.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/sharing/toast-store') as
    typeof import('@/lib/sharing/toast-store');
}

function makeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
    clear: () => { map.clear(); },
  };
}

function installWindow(storageValue: string | null, clipboardOk = true): void {
  const storage = makeStorage(
    storageValue === null
      ? {}
      : { 'quick-mirror-result': storageValue },
  );
  (globalThis as { window?: unknown }).window = {
    localStorage: storage,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  (globalThis as { navigator?: unknown }).navigator = {
    clipboard: {
      writeText: clipboardOk
        ? () => Promise.resolve()
        : () => Promise.reject(new Error('denied')),
    },
  };
}

function teardownWindow(): void {
  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { navigator?: unknown }).navigator;
}

afterEach(() => { teardownWindow(); });

describe('copyWithFeedback — default phrases are lexicon-tinted', () => {
  it('deep-diver stored → success toast uses reflective phrase', async () => {
    installWindow(JSON.stringify({ archetype: 'deep-diver' }));
    const { copyWithFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    await copyWithFeedback('https://example.com');
    expect(read()?.message).toBe('Link copied, quietly.');
    expect(read()?.intent).toBe('confirm');
  });

  it('no archetype stored → success toast uses neutral (kinetic) phrase', async () => {
    installWindow(null);
    const { copyWithFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    await copyWithFeedback('https://example.com');
    expect(read()?.message).toBe('Link copied.');
  });

  it('explicit successMessage override still wins (ThreadKeepsake voice)', async () => {
    installWindow(JSON.stringify({ archetype: 'deep-diver' }));
    const { copyWithFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    await copyWithFeedback(
      'https://example.com',
      'Link copied — the thread travels with it.',
    );
    expect(read()?.message).toBe('Link copied — the thread travels with it.');
  });

  it('failure → reflective "Didn\'t land — try again." with deep-diver stored', async () => {
    installWindow(JSON.stringify({ archetype: 'deep-diver' }), /* clipboardOk */ false);
    // The fallback path uses document.execCommand — which doesn't exist in
    // the node env. Stub it to return false to force the "failed" branch.
    (globalThis as { document?: unknown }).document = {
      createElement: () => ({ style: {}, focus: () => {}, select: () => {} }),
      body: { appendChild: () => {}, removeChild: () => {} },
      execCommand: () => false,
    };
    const { copyWithFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    const ok = await copyWithFeedback('https://example.com');
    expect(ok).toBe(false);
    expect(read()?.message).toBe("Didn't land — try again.");
    expect(read()?.intent).toBe('warn');
    delete (globalThis as { document?: unknown }).document;
  });
});

describe('showCopyFeedback — default uses copy-text tone', () => {
  it('deep-diver stored → "Copied, quietly."', () => {
    installWindow(JSON.stringify({ archetype: 'deep-diver' }));
    const { showCopyFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    showCopyFeedback();
    expect(read()?.message).toBe('Copied, quietly.');
  });

  it('unscored visitor → "Copied." (neutral)', () => {
    installWindow(null);
    const { showCopyFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    showCopyFeedback();
    expect(read()?.message).toBe('Copied.');
  });

  it('explicit override still wins', () => {
    installWindow(JSON.stringify({ archetype: 'deep-diver' }));
    const { showCopyFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    showCopyFeedback('Keepsake copied.');
    expect(read()?.message).toBe('Keepsake copied.');
  });
});
