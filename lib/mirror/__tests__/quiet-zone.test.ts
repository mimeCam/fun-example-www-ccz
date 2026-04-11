/**
 * Quiet Zone tests — pure functions, no React, no DOM.
 *
 * Uses in-memory storage (Map) injected via parameters.
 * Every test verifies one acceptance criterion from Mike's spec.
 */

import {
  readQuietZone,
  shouldAllowReveal,
  enterQuietZone,
  trackArticleVisit,
  clearQuietZone,
} from '../quiet-zone';
import type { QuietZoneConfig } from '@/types/mirror';

const CONFIG: QuietZoneConfig = {
  articleCooldown: 3,
  timeCooldownMs: 45 * 60 * 1000,
  sessionTtlMs: 4 * 60 * 60 * 1000,
};

function createStore() {
  const store = new Map<string, string>();
  return {
    get: (key: string) => store.get(key) ?? null,
    set: (key: string, val: string) => { store.set(key, val); },
    remove: (key: string) => { store.delete(key); },
    store,
  };
}

describe('readQuietZone', () => {
  it('returns null for empty storage', () => {
    const { get } = createStore();
    expect(readQuietZone(get, 1000, CONFIG)).toBeNull();
  });

  it('returns null for corrupted JSON', () => {
    const { get } = createStore();
    const store = new Map([['mirror-quiet-zone', 'not-json']]);
    const getter = (k: string) => store.get(k) ?? null;
    expect(readQuietZone(getter, 1000, CONFIG)).toBeNull();
  });

  it('returns null for schema-invalid data', () => {
    const store = new Map([['mirror-quiet-zone', '{"wrong":true}']]);
    expect(readQuietZone((k) => store.get(k) ?? null, 1000, CONFIG)).toBeNull();
  });

  it('returns null when session TTL expired', () => {
    const { get, set } = createStore();
    const now = 100000;
    enterQuietZone('a1', set, now, CONFIG);
    const expired = now + CONFIG.sessionTtlMs + 1;
    expect(readQuietZone(get, expired, CONFIG)).toBeNull();
  });

  it('returns state when within TTL', () => {
    const { get, set } = createStore();
    const now = 100000;
    enterQuietZone('a1', set, now, CONFIG);
    const state = readQuietZone(get, now + 1000, CONFIG);
    expect(state).toBeTruthy();
    expect(state!.lastArticleId).toBe('a1');
  });
});

describe('shouldAllowReveal', () => {
  it('allows first-time visitor (no quiet zone)', () => {
    const { get } = createStore();
    expect(shouldAllowReveal('a1', get, 1000, CONFIG)).toBe(true);
  });

  it('blocks same article (refresh guard)', () => {
    const { get, set } = createStore();
    const now = 100000;
    enterQuietZone('a1', set, now, CONFIG);
    expect(shouldAllowReveal('a1', get, now + 1000, CONFIG)).toBe(false);
  });

  it('blocks next article immediately after reveal', () => {
    const { get, set } = createStore();
    const now = 100000;
    enterQuietZone('a1', set, now, CONFIG);
    expect(shouldAllowReveal('a2', get, now + 1000, CONFIG)).toBe(false);
  });

  it('allows after article cooldown met (3 unique articles)', () => {
    const { get, set } = createStore();
    const now = 100000;
    enterQuietZone('a1', set, now, CONFIG);

    // Simulate visiting 3 different articles after the reveal
    trackArticleVisit('a2', get, set, now + 1000, CONFIG);
    trackArticleVisit('a3', get, set, now + 2000, CONFIG);
    trackArticleVisit('a4', get, set, now + 3000, CONFIG);

    // Article cooldown IS met → mirror fires (OR logic)
    expect(shouldAllowReveal('a5', get, now + 5000, CONFIG)).toBe(true);
  });

  it('allows when time cooldown expired even with articlesSince < cooldown', () => {
    const { get, set } = createStore();
    const now = 100000;
    enterQuietZone('a1', set, now, CONFIG);

    // Only 1 article since, but 45+ min elapsed
    trackArticleVisit('a2', get, set, now + 1000, CONFIG);
    const afterCooldown = now + CONFIG.timeCooldownMs + 1;
    expect(shouldAllowReveal('a3', get, afterCooldown, CONFIG)).toBe(true);
  });

  it('allows after both cooldowns fully met', () => {
    const { get, set } = createStore();
    const now = 100000;
    enterQuietZone('a1', set, now, CONFIG);

    trackArticleVisit('a2', get, set, now + 1000, CONFIG);
    trackArticleVisit('a3', get, set, now + 2000, CONFIG);
    trackArticleVisit('a4', get, set, now + 3000, CONFIG);

    const afterTime = now + CONFIG.timeCooldownMs + 1;
    expect(shouldAllowReveal('a5', get, afterTime, CONFIG)).toBe(true);
  });

  it('allows after session TTL fully resets', () => {
    const { get, set } = createStore();
    const now = 100000;
    enterQuietZone('a1', set, now, CONFIG);

    const afterSession = now + CONFIG.sessionTtlMs + 1;
    expect(shouldAllowReveal('a2', get, afterSession, CONFIG)).toBe(true);
  });

  it('fail-opens on corrupted state (allows reveal)', () => {
    const store = new Map([['mirror-quiet-zone', 'garbage']]);
    expect(shouldAllowReveal('a1', (k) => store.get(k) ?? null, 1000, CONFIG)).toBe(true);
  });
});

describe('trackArticleVisit', () => {
  it('increments articlesSince for new article', () => {
    const { get, set } = createStore();
    const now = 100000;
    enterQuietZone('a1', set, now, CONFIG);
    trackArticleVisit('a2', get, set, now + 1000, CONFIG);

    const state = readQuietZone(get, now + 2000, CONFIG);
    expect(state!.articlesSince).toBe(1);
  });

  it('does not increment for same article (refresh)', () => {
    const { get, set } = createStore();
    const now = 100000;
    enterQuietZone('a1', set, now, CONFIG);
    trackArticleVisit('a1', get, set, now + 1000, CONFIG);

    const state = readQuietZone(get, now + 2000, CONFIG);
    expect(state!.articlesSince).toBe(0);
  });

  it('does nothing when no quiet zone exists', () => {
    const { get, set, store } = createStore();
    trackArticleVisit('a1', get, set, 1000, CONFIG);
    expect(store.has('mirror-quiet-zone')).toBe(false);
  });
});

describe('clearQuietZone', () => {
  it('removes the storage key', () => {
    const { get, set, store } = createStore();
    enterQuietZone('a1', set, 1000, CONFIG);
    clearQuietZone((key) => { store.delete(key); });
    expect(readQuietZone(get, 2000, CONFIG)).toBeNull();
  });
});
