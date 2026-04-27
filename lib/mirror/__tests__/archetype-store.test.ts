/**
 * archetype-store — SSR safety + localStorage read contract.
 *
 * The pure-TS reader underneath the share seam's tone resolution. Three
 * behaviours are locked:
 *   1. SSR-safe — `window` undefined ⇒ `null` (no throw).
 *   2. Honest read — a well-formed `{ archetype: 'deep-diver' }` round-trips.
 *   3. Corruption-safe — malformed JSON, missing keys, absent values all
 *      fold to `null` without raising.
 *
 * Runs in `testEnvironment: 'node'` — we stub `global.window` by hand so
 * the whole project stays jsdom-free (one fewer dev dep; see `package.json`).
 */

import type { ArchetypeKey } from '@/types/content';

// Fresh module import per test → `typeof window === 'undefined'` branch is
// reachable even though jest caches modules across files. Do the import
// inside helpers to keep top-level SSR-only checks honest.
function loadModule() {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/mirror/archetype-store') as typeof import('@/lib/mirror/archetype-store');
}

/** Minimal localStorage stub — just the two methods the module touches. */
function makeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
    clear: () => { map.clear(); },
  };
}

function withWindow(
  storage: ReturnType<typeof makeStorage>,
  fn: (mod: typeof import('@/lib/mirror/archetype-store')) => void,
  cookieValue: string = '',
): void {
  const listeners = new Set<(e: StorageEvent) => void>();
  (globalThis as { window?: unknown }).window = {
    localStorage: storage,
    addEventListener: (type: string, cb: (e: StorageEvent) => void) => {
      if (type === 'storage') listeners.add(cb);
    },
    removeEventListener: (type: string, cb: (e: StorageEvent) => void) => {
      if (type === 'storage') listeners.delete(cb);
    },
    __dispatchStorage: (key: string) => {
      for (const cb of listeners) cb({ key } as StorageEvent);
    },
  };
  // Provisional layer reads `document.cookie`. Stub it so the layered
  // reads can be exercised without jsdom (Mike §3 — pure tests, no DOM).
  (globalThis as { document?: unknown }).document = { cookie: cookieValue };
  try { fn(loadModule()); }
  finally {
    delete (globalThis as { window?: unknown }).window;
    delete (globalThis as { document?: unknown }).document;
  }
}

describe('archetype-store — SSR safety', () => {
  it('returns null when window is undefined (server render)', () => {
    // No window set — simulate SSR.
    delete (globalThis as { window?: unknown }).window;
    const mod = loadModule();
    expect(mod.readStoredArchetype()).toBeNull();
  });

  it('subscribeArchetype on the server returns a no-op unsubscribe', () => {
    delete (globalThis as { window?: unknown }).window;
    const mod = loadModule();
    const off = mod.subscribeArchetype(() => {});
    expect(typeof off).toBe('function');
    expect(() => off()).not.toThrow();
  });
});

describe('archetype-store — honest reads', () => {
  it('reads a well-formed archetype from the Mirror storage key', () => {
    const storage = makeStorage({
      'quick-mirror-result': JSON.stringify({ archetype: 'deep-diver' as ArchetypeKey }),
    });
    withWindow(storage, (mod) => {
      expect(mod.readStoredArchetype()).toBe('deep-diver');
    });
  });

  it('MIRROR_STORAGE_KEY is the single source of truth', () => {
    const mod = loadModule();
    expect(mod.MIRROR_STORAGE_KEY).toBe('quick-mirror-result');
  });

  it('missing key returns null', () => {
    withWindow(makeStorage(), (mod) => {
      expect(mod.readStoredArchetype()).toBeNull();
    });
  });

  it('payload without archetype field returns null', () => {
    const storage = makeStorage({
      'quick-mirror-result': JSON.stringify({ taken: 1714000000 }),
    });
    withWindow(storage, (mod) => {
      expect(mod.readStoredArchetype()).toBeNull();
    });
  });
});

describe('archetype-store — corruption safety', () => {
  it('corrupt JSON returns null without throwing', () => {
    const storage = makeStorage({ 'quick-mirror-result': '{"not json' });
    withWindow(storage, (mod) => {
      expect(() => mod.readStoredArchetype()).not.toThrow();
      expect(mod.readStoredArchetype()).toBeNull();
    });
  });

  it('empty string returns null', () => {
    const storage = makeStorage({ 'quick-mirror-result': '' });
    withWindow(storage, (mod) => {
      expect(mod.readStoredArchetype()).toBeNull();
    });
  });
});

describe('archetype-store — cross-tab subscription', () => {
  it('fires the listener only for MIRROR_STORAGE_KEY', () => {
    const storage = makeStorage({
      'quick-mirror-result': JSON.stringify({ archetype: 'faithful' as ArchetypeKey }),
    });
    withWindow(storage, (mod) => {
      const hits: (string | null)[] = [];
      const off = mod.subscribeArchetype((a) => hits.push(a));
      const dispatch = (globalThis as {
        window: { __dispatchStorage: (k: string) => void };
      }).window.__dispatchStorage;

      dispatch('unrelated-key');
      dispatch('quick-mirror-result');
      off();
      dispatch('quick-mirror-result'); // after unsubscribe — should be silent

      expect(hits).toEqual(['faithful']);
    });
  });
});

// ─── Layered read — Mirror ?? Provisional ?? null (Mike §1, §6) ────────────

describe('archetype-store — layered read · readEffectiveArchetype', () => {
  it('returns Mirror result when Mirror is present (provisional shadowed)', () => {
    const storage = makeStorage({
      'quick-mirror-result': JSON.stringify({ archetype: 'deep-diver' as ArchetypeKey }),
    });
    withWindow(storage, (mod) => {
      expect(mod.readEffectiveArchetype()).toBe('deep-diver');
    }, '__pt=explorer.0.50');
  });

  it('returns provisional cookie when Mirror is absent', () => {
    withWindow(makeStorage(), (mod) => {
      expect(mod.readEffectiveArchetype()).toBe('explorer');
    }, '__pt=explorer.0.50');
  });

  it('returns null when neither Mirror nor cookie answers', () => {
    withWindow(makeStorage(), (mod) => {
      expect(mod.readEffectiveArchetype()).toBeNull();
    });
  });

  it('Mirror always wins even if both layers disagree', () => {
    const storage = makeStorage({
      'quick-mirror-result': JSON.stringify({ archetype: 'collector' as ArchetypeKey }),
    });
    withWindow(storage, (mod) => {
      // Cookie says explorer, Mirror says collector — Mirror wins.
      expect(mod.readEffectiveArchetype()).toBe('collector');
    }, '__pt=explorer.0.55');
  });

  it('readProvisionalArchetype isolates the cookie layer', () => {
    withWindow(makeStorage(), (mod) => {
      expect(mod.readProvisionalArchetype()).toBe('resonator');
      expect(mod.readStoredArchetype()).toBeNull();
    }, '__pt=resonator.0.55');
  });

  it('corrupt cookie folds to null without throwing', () => {
    withWindow(makeStorage(), (mod) => {
      expect(() => mod.readProvisionalArchetype()).not.toThrow();
      expect(mod.readProvisionalArchetype()).toBeNull();
    }, '__pt=garbled-payload');
  });

  it('cookie missing entirely returns null', () => {
    withWindow(makeStorage(), (mod) => {
      expect(mod.readProvisionalArchetype()).toBeNull();
    }, '');
  });

  it('SSR (no document) returns null on the provisional layer', () => {
    delete (globalThis as { window?: unknown }).window;
    delete (globalThis as { document?: unknown }).document;
    const mod = loadModule();
    expect(mod.readProvisionalArchetype()).toBeNull();
    expect(mod.readEffectiveArchetype()).toBeNull();
  });
});
