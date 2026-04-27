/**
 * middleware — `__rt=1` returner short-circuit, integration pin.
 *
 * Mike DoD §6 (acceptance):
 *   1. Returning reader (`__rt=1` cookie present) navigates → response carries
 *      **no** `Set-Cookie: __pt=...`.
 *   2. First-time visitor with strong signals → `__pt` written as before.
 *   3. `__rt` present + `__pt` present → still no overwrite (idempotent).
 *   4. Skip-prefix path (`/api/*`, `/admin/*`) → never writes `__pt` regardless.
 *
 * We exercise the actual exported `middleware()` to lock the wire behavior
 * end-to-end. The Next.js test runtime is jsdom-free; `NextRequest` is
 * web-standard `Request` underneath, so we instantiate it directly with a
 * URL + headers + cookies. No mocks of `next/server`.
 */

import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { PROVISIONAL_COOKIE } from '@/lib/detection/first-paint-archetype';
import { RETURNER_COOKIE, RETURNER_VALUE } from '@/lib/mirror/returner-sentinel';

// ─── Test fixture helpers — small, named, ≤ 10 LOC each ───────────────────

interface FixtureOpts {
  readonly url?: string;
  readonly referrer?: string;
  readonly userAgent?: string;
  readonly cookies?: Record<string, string>;
}

/** Build a NextRequest with cookies + headers from a small options bag. */
function buildRequest(opts: FixtureOpts = {}): NextRequest {
  const url = opts.url ?? 'http://localhost:7200/articles';
  const headers = new Headers();
  if (opts.referrer) headers.set('referer', opts.referrer);
  if (opts.userAgent) headers.set('user-agent', opts.userAgent);
  const cookieHeader = formatCookies(opts.cookies ?? {});
  if (cookieHeader) headers.set('cookie', cookieHeader);
  return new NextRequest(new URL(url), { headers });
}

/** Encode a record as a `Cookie:` header value. Pure, ≤ 10 LOC. */
function formatCookies(map: Record<string, string>): string {
  return Object.entries(map).map(([k, v]) => `${k}=${v}`).join('; ');
}

/** Return true when the response sets the `__pt` cookie. */
function setsProvisionalCookie(response: Response): boolean {
  // NextResponse#cookies API surfaces the writes as Set-Cookie headers; the
  // simplest cross-runtime read is the Set-Cookie raw string.
  const setCookies = response.headers.getSetCookie?.() ?? [];
  return setCookies.some((c) => c.startsWith(`${PROVISIONAL_COOKIE}=`));
}

// ─── Acceptance #1 — returner present ⇒ no __pt write ─────────────────────

describe('middleware — __rt=1 returner short-circuit', () => {
  it('skips __pt write when __rt=1 is present (returner)', () => {
    const req = buildRequest({
      url: 'http://localhost:7200/articles',
      referrer: 'https://news.ycombinator.com/',
      userAgent: 'Mozilla/5.0 (Macintosh)',
      cookies: { [RETURNER_COOKIE]: RETURNER_VALUE },
    });
    const res = middleware(req);
    expect(setsProvisionalCookie(res as Response)).toBe(false);
  });

  it('skips __pt write even when __rt is present alongside __pt', () => {
    // Idempotent: returner + already-written __pt → still no new write.
    const req = buildRequest({
      url: 'http://localhost:7200/articles',
      cookies: {
        [RETURNER_COOKIE]: RETURNER_VALUE,
        [PROVISIONAL_COOKIE]: 'deep-diver.0.55',
      },
    });
    const res = middleware(req);
    expect(setsProvisionalCookie(res as Response)).toBe(false);
  });

  it('skips __pt for a returner even with strong signals (HN + /resonances)', () => {
    const req = buildRequest({
      url: 'http://localhost:7200/resonances',
      referrer: 'https://news.ycombinator.com/',
      userAgent: 'Mozilla/5.0 (Macintosh)',
      cookies: { [RETURNER_COOKIE]: RETURNER_VALUE },
    });
    const res = middleware(req);
    expect(setsProvisionalCookie(res as Response)).toBe(false);
  });
});

// ─── Acceptance #2 — first-time visitor ⇒ unchanged ───────────────────────

describe('middleware — first-time visitor (no __rt) — unchanged', () => {
  it('writes __pt when signals clear the floor (HN + /articles)', () => {
    const req = buildRequest({
      url: 'http://localhost:7200/articles',
      referrer: 'https://news.ycombinator.com/',
    });
    const res = middleware(req);
    expect(setsProvisionalCookie(res as Response)).toBe(true);
  });

  it('does NOT write __pt when no lane fires (silence is a feature)', () => {
    const req = buildRequest({ url: 'http://localhost:7200/' });
    const res = middleware(req);
    expect(setsProvisionalCookie(res as Response)).toBe(false);
  });
});

// ─── Acceptance #4 — skip prefixes ─────────────────────────────────────────

describe('middleware — skip-prefix paths', () => {
  it.each([
    // `/_next/data/...` triggers Next's NextURL pathname normalization
    // (build-id stripping) — exercise the prefix skip via `/api` and
    // `/admin`, which are not normalized.
    'http://localhost:7200/api/articles',
    'http://localhost:7200/admin/funnel',
  ])('never writes __pt for %s', (url) => {
    const req = buildRequest({
      url,
      referrer: 'https://news.ycombinator.com/',
    });
    const res = middleware(req);
    expect(setsProvisionalCookie(res as Response)).toBe(false);
  });
});
