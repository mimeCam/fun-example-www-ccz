/**
 * export-utils — direct-gesture asymmetry contract for the quote-card surface.
 *
 * After Mike #81 / Tanya #75 the success path is **silent** — the witness
 * lives at the fingertip on the host (`<QuoteKeepsake>`'s `<ActionPressable>`
 * row), not in the room. This suite locks the new contract:
 *
 *   1. `showExportError` still toasts on failure (warn intent) — phrases
 *      route through the `replyPhrase` lexicon for archetype tinting.
 *   2. The retired `showExportFeedback` is gone from the public surface
 *      (no success-toast emitter anywhere in this module).
 *   3. `exportQuoteCard` resolves a boolean and emits **no `intent:'confirm'`
 *      toast** on success — the caller's `pulse(ok)` is the receipt.
 *   4. `exportQuoteCard` falls back to `showExportError` (warn) once the
 *      retry budget is exhausted — failure escalates one level.
 *
 * Same loader / window-shim pattern as the previous suite, kept intact so
 * the lexicon archetype tinting stays exercised end-to-end.
 *
 * Credits: Mike K. (#81 — the new contract: success silent, failure loud),
 * Tanya D. (#75 §4.1 — the four-cell test matrix the migration must hit),
 * Sid (this rewrite).
 */

function loadExport() {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/quote-cards/export-utils') as
    typeof import('@/lib/quote-cards/export-utils');
}

function loadToastStore() {
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

function installWindow(storageValue: string | null): void {
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
}

afterEach(() => { delete (globalThis as { window?: unknown }).window; });

// ─── Failure path — warn-intent toast, lexicon-tinted (asymmetry "loud") ───

describe('showExportError — warn intent, lexicon-tinted', () => {
  it('deep-diver + download → "Didn\'t land — try again."', () => {
    installWindow(JSON.stringify({ archetype: 'deep-diver' }));
    const { showExportError } = loadExport();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    showExportError('download');
    expect(read()?.message).toBe("Didn't land — try again.");
    expect(read()?.intent).toBe('warn');
  });

  it('no archetype + clipboard → "Copy failed."', () => {
    installWindow(null);
    const { showExportError } = loadExport();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    showExportError('clipboard');
    expect(read()?.message).toBe('Copy failed.');
    expect(read()?.intent).toBe('warn');
  });

  it('resonator + download → analytical "Download failed."', () => {
    installWindow(JSON.stringify({ archetype: 'resonator' }));
    const { showExportError } = loadExport();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    showExportError('download');
    expect(read()?.message).toBe('Download failed.');
  });
});

// ─── Public surface — the retired success emitter is gone ──────────────────

describe('export-utils — success toast surface retired (Mike #81 / Tanya #75)', () => {
  it('does NOT export `showExportFeedback`', () => {
    const mod = loadExport() as Record<string, unknown>;
    expect(mod.showExportFeedback).toBeUndefined();
  });

  it('still exports the public surface the host depends on', () => {
    const mod = loadExport();
    expect(typeof mod.exportQuoteCard).toBe('function');
    expect(typeof mod.downloadQuoteCard).toBe('function');
    expect(typeof mod.copyQuoteCardToClipboard).toBe('function');
    expect(typeof mod.showExportError).toBe('function');
  });
});

// ─── Asymmetry contract — exportQuoteCard's success silence + failure escalation ─

type GlobalDocSlot = { document?: unknown };
type GlobalWinSlot = { window?: { document?: unknown } };

/** Stub a successful download path: a fake `<a>` link that no-ops on click. */
function installDownloadDom(): void {
  const fakeLink = { href: '', download: '', click: () => {} };
  const fakeDoc = {
    createElement: () => fakeLink,
    body: { appendChild: () => {}, removeChild: () => {} },
  };
  (globalThis as unknown as GlobalDocSlot).document = fakeDoc;
  const slot = globalThis as unknown as GlobalWinSlot;
  if (slot.window) slot.window.document = fakeDoc;
}

function uninstallDownloadDom(): void {
  delete (globalThis as unknown as GlobalDocSlot).document;
}

describe('exportQuoteCard — silent on success (asymmetry contract)', () => {
  afterEach(uninstallDownloadDom);

  it('returns true and emits NO confirm toast on download success', async () => {
    installWindow(null);
    installDownloadDom();
    const { exportQuoteCard } = loadExport();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    const ok = await exportQuoteCard('data:image/png;base64,AAAA', 'download');
    expect(ok).toBe(true);
    expect(read()).toBeNull();
  });
});

describe('exportQuoteCard — loud on failure (asymmetry contract)', () => {
  afterEach(uninstallDownloadDom);

  it('returns false and emits a warn toast after the retry budget', async () => {
    installWindow(null);
    // No `document` shim → `downloadQuoteCard` throws → all retries fail.
    const { exportQuoteCard } = loadExport();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    const ok = await exportQuoteCard(
      'data:image/png;base64,AAAA', 'download', {}, 0,
    );
    expect(ok).toBe(false);
    expect(read()?.intent).toBe('warn');
  });
});
