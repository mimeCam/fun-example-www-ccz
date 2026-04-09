/**
 * Next.js middleware — Edge Runtime request timing.
 *
 * Sets x-request-start and x-response-time headers for observability.
 * No PII logging — console logging removed for production safety.
 */

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
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
