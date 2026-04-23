/**
 * export-utils — toast phrases route through the lexicon.
 *
 * Same contract as `clipboard-utils.test.ts`, for the quote-card export
 * surfaces. Two visible cells shift for reflective readers:
 *   - `showExportFeedback('download')` → "Saved."
 *   - the rest stay on their neutral defaults.
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

describe('showExportFeedback — download surface', () => {
  it('deep-diver → reflective "Saved."', () => {
    installWindow(JSON.stringify({ archetype: 'deep-diver' }));
    const { showExportFeedback } = loadExport();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    showExportFeedback('download');
    expect(read()?.message).toBe('Saved.');
    expect(read()?.intent).toBe('confirm');
  });

  it('resonator → analytical "Downloaded (PNG)."', () => {
    installWindow(JSON.stringify({ archetype: 'resonator' }));
    const { showExportFeedback } = loadExport();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    showExportFeedback('download');
    expect(read()?.message).toBe('Downloaded (PNG).');
  });

  it('no archetype → neutral "Downloaded."', () => {
    installWindow(null);
    const { showExportFeedback } = loadExport();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    showExportFeedback('download');
    expect(read()?.message).toBe('Downloaded.');
  });
});

describe('showExportFeedback — clipboard surface', () => {
  it('deep-diver → reflective "Card copied."', () => {
    installWindow(JSON.stringify({ archetype: 'deep-diver' }));
    const { showExportFeedback } = loadExport();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    showExportFeedback('clipboard');
    expect(read()?.message).toBe('Card copied.');
  });

  it('resonator → analytical "Image copied."', () => {
    installWindow(JSON.stringify({ archetype: 'resonator' }));
    const { showExportFeedback } = loadExport();
    const { __resetToastStoreForTest: reset, getCurrentToast: read } =
      loadToastStore();
    reset();
    showExportFeedback('clipboard');
    expect(read()?.message).toBe('Image copied.');
  });
});

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
});

describe('showExportFeedback — callback still fires', () => {
  it('invokes the onSuccess callback after publishing the toast', () => {
    installWindow(null);
    const { showExportFeedback } = loadExport();
    const { __resetToastStoreForTest: reset } = loadToastStore();
    reset();
    const onSuccess = jest.fn();
    showExportFeedback('download', onSuccess);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
