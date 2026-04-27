/**
 * Next.js middleware — request timing, route redirects, and the
 * provisional-tone cookie writer.
 *
 * Three responsibilities, narrow scope:
 *   1. Redirect stale routes to canonical equivalents (`/explore` → `/articles`).
 *   2. Set `x-request-start` / `x-response-time` headers for observability.
 *   3. Write the `__pt` provisional-tone cookie on first paint, so the
 *      killer feature ("words that move on the immovable stage") fires on
 *      visit one (Mike `from-michael-koch-project-architect-76.md` §1).
 *
 * The cookie writer is silent — it never overrides an existing Mirror
 * snapshot (the client-side `readEffectiveArchetype` reads Mirror first),
 * never overwrites an existing `__pt`, never fires for `/api`, `/_next`,
 * `/admin`. Falls back to neutral when signals are weak (`null` from
 * `guessProvisionalTone` → no cookie set).
 *
 * Credits: Mike K. (`§1` napkin diagram + `§3` cookie spec — `Path=/`,
 * `SameSite=Lax`, 1h TTL, `HttpOnly=false` so client-side reader keeps
 * its pure-TS API; `§7` skip-list and trust-clause guards), Tanya D.
 * (the silent-by-construction discipline — the cookie does not announce),
 * Paul K. (the felt-not-flagged Tier S4 doctrine).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  guessProvisionalTone,
  encodeProvisionalCookie,
  PROVISIONAL_COOKIE,
  type FirstPaintSignals,
} from '@/lib/detection/first-paint-archetype';
import { RETURNER_COOKIE } from '@/lib/mirror/returner-sentinel';

const REDIRECTS: Record<string, string> = {
  '/explore': '/articles',
};

/** Routes the cookie writer skips (no point guessing for the API or admin). */
const PROVISIONAL_SKIP_PREFIXES: readonly string[] = [
  '/api', '/_next', '/admin',
];

/** Cookie TTL — 1 hour. Provisional means provisional (Mike §3). */
const PROVISIONAL_TTL_SECONDS = 60 * 60;

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const target = REDIRECTS[pathname];
  if (target) {
    return NextResponse.redirect(new URL(target + search, request.url));
  }

  const startTime = Date.now();
  const response = NextResponse.next();

  response.headers.set('x-request-start', startTime.toString());
  response.headers.set('x-response-time', (Date.now() - startTime).toString());

  maybeSetProvisionalCookie(request, response, pathname);
  return response;
}

/**
 * Compose `FirstPaintSignals` from request headers and run the guess.
 * Pure orchestration, ≤ 10 LOC. Splitting this out keeps the main `middleware`
 * function readable and lets the unit tests exercise the heuristic without
 * spinning up Next's Request/Response machinery.
 */
function maybeSetProvisionalCookie(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
): void {
  if (!shouldGuess(request, pathname)) return;
  const signals = signalsFrom(request, pathname);
  const tone = guessProvisionalTone(signals);
  if (!tone) return;
  response.cookies.set(PROVISIONAL_COOKIE, encodeProvisionalCookie(tone), {
    path: '/', maxAge: PROVISIONAL_TTL_SECONDS, sameSite: 'lax', httpOnly: false,
  });
}

/**
 * Skip when path is excluded, OR a `__pt` cookie already exists, OR the
 * reader carries the `__rt=1` returner sentinel — that last one is the
 * trust clause: a reader who has answered the Mirror once is never re-
 * guessed (Mike §1, Tanya UX §1). Sibling check to the `__pt` short-
 * circuit, deliberately adjacent so the symmetry is visible.
 */
function shouldGuess(request: NextRequest, pathname: string): boolean {
  if (PROVISIONAL_SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  if (request.cookies.has(PROVISIONAL_COOKIE)) return false;
  if (request.cookies.has(RETURNER_COOKIE)) return false;
  return true;
}

/**
 * Build the heuristic input bag from the request. Pure, ≤ 10 LOC. The
 * `hasReturnerCookie` field stays on the signal shape because the heuristic
 * itself short-circuits on it (defense in depth) — but in practice the
 * `shouldGuess()` gate above already returns `false` before we reach this
 * builder for any returner. The two checks are belt-and-braces, not
 * redundancy: one stops the cookie write, one stops a wrong guess.
 *
 * Telemetry follow-up: a `first_paint_vs_mirror_agreement` counter belongs
 * with the next observability seam, not bolted on here (Mike §5, deferred
 * per Paul's focus contract). TODO(telemetry-followup).
 */
function signalsFrom(request: NextRequest, pathname: string): FirstPaintSignals {
  return {
    referrer: request.headers.get('referer'),
    userAgent: request.headers.get('user-agent'),
    pathname,
    hourLocal: new Date().getUTCHours(),
    hasReturnerCookie: request.cookies.has(RETURNER_COOKIE),
  };
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
