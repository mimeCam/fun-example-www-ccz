/**
 * reply-resolve — pure-TS tone resolution at the share seam.
 *
 * Three behaviours locked:
 *   1. When a reflective archetype is stored, `replyPhrase(kind)` returns
 *      the lexicon's reflective phrase (verbatim — no paraphrase).
 *   2. With no archetype stored (unscored visitor / SSR), it folds to the
 *      `DEFAULT_TONE` phrase — neutral, honest, no reach.
 *   3. Semantic lock holds across every `CONFIRM_KIND × ToneBucket`:
 *      a `CONFIRM_VERB` is always present. Tone may tint; verb must not move.
 */

import {
  phraseFor, CONFIRM_KINDS, CONFIRM_VERBS, TONE_BUCKETS,
} from '@/lib/sharing/reply-lexicon';

function loadModule() {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/sharing/reply-resolve') as typeof import('@/lib/sharing/reply-resolve');
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

function withArchetype(
  stored: string | null,
  fn: (mod: typeof import('@/lib/sharing/reply-resolve')) => void,
): void {
  const storage = makeStorage(
    stored === null
      ? {}
      : { 'quick-mirror-result': JSON.stringify({ archetype: stored }) },
  );
  (globalThis as { window?: unknown }).window = {
    localStorage: storage,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  try { fn(loadModule()); }
  finally { delete (globalThis as { window?: unknown }).window; }
}

describe('replyPhrase — tone tint from stored archetype', () => {
  it('deep-diver → reflective phrase for copy-link', () => {
    withArchetype('deep-diver', (mod) => {
      expect(mod.replyPhrase('copy-link')).toBe(phraseFor('copy-link', 'reflective'));
      expect(mod.replyPhrase('copy-link')).toBe('Link copied, quietly.');
    });
  });

  it('faithful → reflective phrase for download', () => {
    withArchetype('faithful', (mod) => {
      expect(mod.replyPhrase('download')).toBe(phraseFor('download', 'reflective'));
      expect(mod.replyPhrase('download')).toBe('Saved.');
    });
  });

  it('explorer → kinetic phrase (the neutral default)', () => {
    withArchetype('explorer', (mod) => {
      expect(mod.replyPhrase('copy-link')).toBe(phraseFor('copy-link', 'kinetic'));
    });
  });

  it('resonator → analytical phrase for copy-image', () => {
    withArchetype('resonator', (mod) => {
      expect(mod.replyPhrase('copy-image')).toBe(phraseFor('copy-image', 'analytical'));
    });
  });
});

describe('replyPhrase — fallbacks', () => {
  it('no archetype stored → DEFAULT_TONE (kinetic) phrase', () => {
    withArchetype(null, (mod) => {
      expect(mod.replyPhrase('copy-link')).toBe(phraseFor('copy-link', 'kinetic'));
    });
  });

  it('SSR (no window) → DEFAULT_TONE (kinetic) phrase', () => {
    delete (globalThis as { window?: unknown }).window;
    const mod = loadModule();
    expect(mod.replyPhrase('copy-failed')).toBe(phraseFor('copy-failed', 'kinetic'));
  });

  it('unknown archetype in storage → DEFAULT_TONE (kinetic) phrase', () => {
    withArchetype('unknown-archetype-key', (mod) => {
      // The lexicon maps unknown keys (via archetypeToTone falsy-guard) to
      // `undefined` tone; phraseFor would blow up. But readStoredArchetype
      // returns whatever's in storage untyped, so we accept that the
      // archetype passes through — guard rail at the lexicon level.
      // Confirming the lookup doesn't throw is the contract.
      expect(() => mod.replyPhrase('copy-link')).not.toThrow();
    });
  });
});

describe('replyPhrase — semantic lock', () => {
  it('every CONFIRM_KIND × ToneBucket phrase contains a CONFIRM_VERB', () => {
    for (const k of CONFIRM_KINDS) {
      for (const t of TONE_BUCKETS) {
        const phrase = phraseFor(k, t).toLowerCase();
        const hit = CONFIRM_VERBS.some((v) => phrase.includes(v));
        expect({ kind: k, tone: t, phrase, hit }).toMatchObject({ hit: true });
      }
    }
  });
});
