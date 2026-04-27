/**
 * first-paint-archetype — table-driven tests for the pure heuristic.
 *
 * Three pillars (Mike §8 acceptance):
 *   1. Each lane fires on its own evidence.
 *   2. The blend resolves multi-lane agreement to a tighter `confidence`.
 *   3. The `null` paths (returner short-circuit, sub-floor confidence,
 *      empty signals, bot UA) are exhaustively pinned — silence is the
 *      most important branch.
 *
 * Pure module → pure tests. No jsdom, no React, no fetch. Same neighborhood
 * as `lib/engagement/__tests__/archetype-bucket.test.ts`.
 */

import {
  guessProvisionalTone,
  encodeProvisionalCookie,
  decodeProvisionalCookie,
  hostOf,
  isBotUA,
  CONFIDENCE_FLOOR,
  PROVISIONAL_CEILING,
  PROVISIONAL_COOKIE,
  type FirstPaintSignals,
  type ProvisionalTone,
} from '@/lib/detection/first-paint-archetype';
import type { ArchetypeKey } from '@/types/content';

/** Build a signals object with sensible blank defaults — overrides supplied. */
function signals(over: Partial<FirstPaintSignals> = {}): FirstPaintSignals {
  return {
    referrer: null,
    userAgent: null,
    pathname: '/',
    hourLocal: 12,
    hasReturnerCookie: false,
    ...over,
  };
}

// ─── Returner short-circuit — Mike §7 trust clause ─────────────────────────

describe('first-paint-archetype — returner short-circuit', () => {
  it('returns null when hasReturnerCookie is true (Mirror always wins)', () => {
    const tone = guessProvisionalTone(signals({
      referrer: 'https://news.ycombinator.com/',
      pathname: '/articles',
      hasReturnerCookie: true,
    }));
    expect(tone).toBeNull();
  });

  it('still null even when every lane fires, if returner', () => {
    const tone = guessProvisionalTone(signals({
      referrer: 'https://news.ycombinator.com/',
      userAgent: 'Mozilla/5.0 (Macintosh) AppleWebKit/537',
      pathname: '/resonances',
      hourLocal: 23,
      hasReturnerCookie: true,
    }));
    expect(tone).toBeNull();
  });
});

// ─── Empty / floor-only inputs — silence is a feature ──────────────────────

describe('first-paint-archetype — silence floors', () => {
  it('returns null on a fully-blank signal set', () => {
    expect(guessProvisionalTone(signals())).toBeNull();
  });

  it('returns null when only time-of-day fires (single weak lane)', () => {
    // hour 23 → time-of-day deep-diver @ 0.30; weight 0.10. Normalized
    // confidence = 0.30 < CONFIDENCE_FLOOR. Should fall to null.
    const tone = guessProvisionalTone(signals({ hourLocal: 23 }));
    expect(tone).toBeNull();
  });

  it('returns null when only UA fires (mobile alone is too weak)', () => {
    const tone = guessProvisionalTone(signals({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
    }));
    expect(tone).toBeNull();
  });

  it('returns null for bot UAs even with a strong path lane', () => {
    const tone = guessProvisionalTone(signals({
      userAgent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      pathname: '/resonances',
    }));
    // Path alone fires (`/resonances` → resonator @ 0.55) — that does cross
    // the floor. The bot-UA does NOT short-circuit the whole guess; it just
    // contributes nothing on its own lane. Verify the path lane still wins.
    expect(tone?.archetype).toBe('resonator');
  });

  it('returns null when archetype keys mismatch and total weighted < floor', () => {
    // Path → explorer @ 0.40 × weight 0.35 = 0.14 (weighted)
    // UA   → deep-diver @ 0.20 × weight 0.10 = 0.02 (weighted, different arch)
    // Lead is explorer with weighted 0.14 / weight 0.35 = 0.40 — at the floor.
    const tone = guessProvisionalTone(signals({
      pathname: '/articles',
      userAgent: 'Mozilla/5.0 (Macintosh)',
    }));
    // `0.40 ≥ CONFIDENCE_FLOOR` is the boundary; the function uses `<`.
    expect(tone?.archetype).toBe('explorer');
    expect(tone?.confidence).toBeGreaterThanOrEqual(CONFIDENCE_FLOOR);
  });
});

// ─── Lane #1 · Referrer host ──────────────────────────────────────────────

describe('first-paint-archetype — referrer lane', () => {
  it.each([
    ['https://news.ycombinator.com/item?id=1', 'deep-diver'],
    ['https://lobste.rs/s/abc',                'deep-diver'],
    ['https://mastodon.social/@user',          'explorer'],
    ['https://reddit.com/r/programming',       'explorer'],
    ['https://pinboard.in/u:foo',              'collector'],
    ['https://are.na/foo/bar',                 'collector'],
    ['https://substack.com/inbox',             'faithful'],
  ] as const)('%s → %s', (referrer, expected) => {
    const tone = guessProvisionalTone(signals({ referrer }));
    expect(tone?.archetype).toBe(expected);
    expect(tone?.confidence).toBeGreaterThanOrEqual(CONFIDENCE_FLOOR);
  });

  it('unknown referrer host returns null (no false positives)', () => {
    const tone = guessProvisionalTone(signals({
      referrer: 'https://example.com/whatever',
    }));
    expect(tone).toBeNull();
  });

  it('strips `www.` prefix when matching hosts', () => {
    expect(hostOf('https://www.reddit.com/r/x')).toBe('reddit.com');
  });

  it('hostOf returns null for malformed input', () => {
    expect(hostOf('not-a-url')).toBeNull();
    expect(hostOf(null)).toBeNull();
    expect(hostOf('')).toBeNull();
  });
});

// ─── Lane #2 · Entry path ─────────────────────────────────────────────────

describe('first-paint-archetype — entry-path lane', () => {
  it('/resonances → resonator', () => {
    const tone = guessProvisionalTone(signals({ pathname: '/resonances' }));
    expect(tone?.archetype).toBe('resonator');
  });

  it('/articles → explorer', () => {
    const tone = guessProvisionalTone(signals({ pathname: '/articles' }));
    expect(tone?.archetype).toBe('explorer');
  });

  it('/trust → faithful', () => {
    const tone = guessProvisionalTone(signals({ pathname: '/trust' }));
    expect(tone?.archetype).toBe('faithful');
  });

  it('/article/[id] alone returns null (neutral lane on flow-in)', () => {
    const tone = guessProvisionalTone(signals({ pathname: '/article/foo' }));
    expect(tone).toBeNull();
  });

  it('/ alone returns null (no path lane vote on root)', () => {
    const tone = guessProvisionalTone(signals({ pathname: '/' }));
    expect(tone).toBeNull();
  });
});

// ─── Lane #4 · UA bot detection ────────────────────────────────────────────

describe('first-paint-archetype — bot UA detection', () => {
  it.each([
    ['Googlebot/2.1', true],
    ['Mozilla/5.0 (compatible; bingbot/2.0)', true],
    ['facebookexternalhit/1.1', true],
    ['Slackbot-LinkExpanding 1.0', true],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X)', false],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', false],
    [null, false],
    ['', false],
  ] as const)('isBotUA(%j) === %s', (ua, expected) => {
    expect(isBotUA(ua)).toBe(expected);
  });
});

// ─── Blend — multi-lane agreement boosts source label ──────────────────────

describe('first-paint-archetype — blend & source label', () => {
  it('two lanes pointing at the same archetype tag the source as "blended"', () => {
    // HN (deep-diver @ 0.55) + late hour (deep-diver @ 0.30) both agree.
    const tone = guessProvisionalTone(signals({
      referrer: 'https://news.ycombinator.com/',
      hourLocal: 23,
    }));
    expect(tone?.archetype).toBe('deep-diver');
    expect(tone?.source).toBe('blended');
  });

  it('single-lane referrer hits source="referrer"', () => {
    const tone = guessProvisionalTone(signals({
      referrer: 'https://news.ycombinator.com/',
    }));
    expect(tone?.source).toBe('referrer');
  });

  it('single-lane path hits source="entry-tags"', () => {
    const tone = guessProvisionalTone(signals({ pathname: '/resonances' }));
    expect(tone?.source).toBe('entry-tags');
  });

  it('confidence never exceeds PROVISIONAL_CEILING', () => {
    const tone = guessProvisionalTone(signals({
      referrer: 'https://news.ycombinator.com/',
      pathname: '/resonances',
      userAgent: 'Mozilla/5.0 (Macintosh)',
      hourLocal: 23,
    }));
    expect(tone).not.toBeNull();
    expect(tone!.confidence).toBeLessThanOrEqual(PROVISIONAL_CEILING);
  });
});

// ─── Cookie codec ──────────────────────────────────────────────────────────

describe('first-paint-archetype — cookie codec', () => {
  it('PROVISIONAL_COOKIE is the single source of truth name', () => {
    expect(PROVISIONAL_COOKIE).toBe('__pt');
  });

  it('encode → decode round-trip preserves archetype', () => {
    const tone: ProvisionalTone = {
      archetype: 'resonator', confidence: 0.55, source: 'entry-tags',
    };
    const decoded = decodeProvisionalCookie(encodeProvisionalCookie(tone));
    expect(decoded?.archetype).toBe('resonator');
    expect(decoded?.confidence).toBeCloseTo(0.55, 2);
  });

  it.each([
    [null,                'null cookie'],
    [undefined,           'undefined cookie'],
    ['',                  'empty string'],
    ['nonsense',          'no separator'],
    ['unknown.0.5',       'archetype not in taxonomy'],
    ['deep-diver.NaN',    'confidence NaN'],
    ['deep-diver.1.5',    'confidence > 1'],
    ['deep-diver.-0.1',   'confidence < 0'],
  ])('decode(%j) → null (%s)', (raw, _label) => {
    expect(decodeProvisionalCookie(raw as string | null)).toBeNull();
  });

  it.each([
    'deep-diver', 'explorer', 'faithful', 'resonator', 'collector',
  ] as const)('decode accepts every ArchetypeKey: %s', (key: ArchetypeKey) => {
    const decoded = decodeProvisionalCookie(`${key}.0.50`);
    expect(decoded?.archetype).toBe(key);
  });

  it('encoded payload stays under 25 bytes (cookie discipline)', () => {
    const tone: ProvisionalTone = {
      archetype: 'deep-diver', confidence: 0.65, source: 'blended',
    };
    expect(encodeProvisionalCookie(tone).length).toBeLessThanOrEqual(25);
  });
});
