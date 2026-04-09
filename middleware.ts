/**
 * Next.js middleware — request timing + route redirects.
 *
 * Sets x-request-start and x-response-time headers for observability.
 * Redirects stale routes to their canonical equivalents.
 */

import { NextRequest, NextResponse } from 'next/server';

const REDIRECTS: Record<string, string> = {
  '/explore': '/articles',
};

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const target = REDIRECTS[pathname];
  if (target) {
    return NextResponse.redirect(new URL(target + search, request.url));
  }

  const startTime = Date.now();
  const response = NextResponse.next();

  const responseTime = Date.now() - startTime;
  response.headers.set('x-request-start', startTime.toString());
  response.headers.set('x-response-time', responseTime.toString());

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
