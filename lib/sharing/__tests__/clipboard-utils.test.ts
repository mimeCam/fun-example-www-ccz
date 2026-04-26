/**
 * clipboard-utils — quiet-on-success defaults + lexicon-tinted phrases.
 *
 * The PR delta (Mike #21 / Tanya #10 — the Quiet Keepsake):
 *   1. `copyWithFeedback` is **quiet on success** by default — the
 *      caller's fingertip witness owns the receipt. No toast fires.
 *   2. Failure ALWAYS escalates to the room (warn-intent toast). The
 *      reader needs to know when the contract breaks.
 *   3. `announce: 'room'` opt-in restores the loud success path for
 *      surfaces with no fingertip witness (`navigator.share` failover).
 *   4. Default phrases still flow through `replyPhrase(kind)` when the
 *      caller hasn't supplied an explicit override; explicit
 *      `successMessage` / `failureMessage` overrides still win.
 *   5. `showCopyFeedback()` is also quiet by default — same flag, same
 *      contract — and now returns `null` when no toast was emitted.
 *
 * The clipboard API itself is stubbed; we only care about the toast-store
 * outcome, not whether the browser actually wrote anything.
 *
 * Credits: Mike K. (#21 — boolean-flip implementation, two-files diff,
 * no 9th ledger), Tanya D. (#10 §2.1 — failure-escalates asymmetry, the
 * Fingertip-Receipt Covenant), Elon M. (the same-source recognition that
 * the screen-reader peer is not a third voice), Krystle C. (the original
 * surgical-fix scaffolding), Sid (this regression suite).
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

function installFailingDocument(): void {
  // The fallback path uses document.execCommand — which doesn't exist in
  // the node env. Stub it to return false to force the "failed" branch.
  (globalThis as { document?: unknown }).document = {
    createElement: () => ({ style: {}, focus: () => {}, select: () => {} }),
    body: { appendChild: () => {}, removeChild: () => {} },
    execCommand: () => false,
  };
}

function teardownWindow(): void {
  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { navigator?: unknown }).navigator;
  delete (globalThis as { document?: unknown }).document;
}

afterEach(() => { teardownWindow(); });

describe('copyWithFeedback — quiet-on-success default', () => {
  it('success → no toast fires (fingertip owns the receipt)', async () => {
    installWindow(JSON.stringify({ archetype: 'deep-diver' }));
    const { copyWithFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    const ok = await copyWithFeedback('https://example.com');
    expect(ok).toBe(true);
    expect(read()).toBeNull();
  });

  it('success + explicit successMessage → still no toast (override is for the room voice path)', async () => {
    installWindow(null);
    const { copyWithFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    await copyWithFeedback('https://example.com', {
      successMessage: 'Link copied — the thread travels with it.',
    });
    expect(read()).toBeNull();
  });

  it("failure → room voice escalates with 'warn' intent (failure breaks the contract)", async () => {
    installWindow(JSON.stringify({ archetype: 'deep-diver' }), /* clipboardOk */ false);
    installFailingDocument();
    const { copyWithFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    const ok = await copyWithFeedback('https://example.com');
    expect(ok).toBe(false);
    expect(read()?.message).toBe("Didn't land — try again.");
    expect(read()?.intent).toBe('warn');
  });

  it('failure + explicit failureMessage → override wins, intent stays warn', async () => {
    installWindow(null, /* clipboardOk */ false);
    installFailingDocument();
    const { copyWithFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    await copyWithFeedback('https://example.com', {
      failureMessage: "Couldn't copy — try Save instead.",
    });
    expect(read()?.message).toBe("Couldn't copy — try Save instead.");
    expect(read()?.intent).toBe('warn');
  });
});

describe("copyWithFeedback — announce: 'room' opt-in (no-fingertip surfaces)", () => {
  it('room + success → confirm toast fires using the lexicon default', async () => {
    installWindow(JSON.stringify({ archetype: 'deep-diver' }));
    const { copyWithFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    await copyWithFeedback('https://example.com', { announce: 'room' });
    expect(read()?.message).toBe('Link copied, quietly.');
    expect(read()?.intent).toBe('confirm');
  });

  it('room + neutral archetype → confirm toast uses the kinetic default', async () => {
    installWindow(null);
    const { copyWithFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    await copyWithFeedback('https://example.com', { announce: 'room' });
    expect(read()?.message).toBe('Link copied.');
  });

  it('room + explicit successMessage → override wins (ThreadKeepsake share-failover voice)', async () => {
    installWindow(JSON.stringify({ archetype: 'deep-diver' }));
    const { copyWithFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    await copyWithFeedback('https://example.com', {
      announce: 'room',
      successMessage: 'Share unsupported — link copied instead.',
    });
    expect(read()?.message).toBe('Share unsupported — link copied instead.');
  });
});

describe('showCopyFeedback — quiet-on-success default + room opt-in', () => {
  it("default (no announce) → returns null, no toast emitted", () => {
    installWindow(JSON.stringify({ archetype: 'deep-diver' }));
    const { showCopyFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    const handle = showCopyFeedback();
    expect(handle).toBeNull();
    expect(read()).toBeNull();
  });

  it("announce='room' + deep-diver → 'Copied, quietly.'", () => {
    installWindow(JSON.stringify({ archetype: 'deep-diver' }));
    const { showCopyFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    const handle = showCopyFeedback(undefined, 'room');
    expect(handle).not.toBeNull();
    expect(read()?.message).toBe('Copied, quietly.');
  });

  it("announce='room' + unscored visitor → 'Copied.' (neutral)", () => {
    installWindow(null);
    const { showCopyFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    showCopyFeedback(undefined, 'room');
    expect(read()?.message).toBe('Copied.');
  });

  it("announce='room' + explicit override still wins", () => {
    installWindow(JSON.stringify({ archetype: 'deep-diver' }));
    const { showCopyFeedback } = loadClipboard();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    showCopyFeedback('Keepsake copied.', 'room');
    expect(read()?.message).toBe('Keepsake copied.');
  });
});
