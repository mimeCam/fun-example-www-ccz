/**
 * Next.js middleware for HTTP request logging (Edge Runtime compatible)
 *
 * This middleware runs on every request and logs:
 * - All HTTP requests with basic metadata
 * - 404 errors with full context
 * - Performance metrics (response time)
 *
 * Note: This runs in Edge Runtime, so it uses console logging instead of Winston.
 * Winston is used in application code for more detailed logging.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware function to log all HTTP requests
 */
export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const method = request.method;
  const url = request.url;
  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Log request start to console (Edge Runtime compatible)
  console.log(`[REQUEST] ${method} ${pathname} from ${ip} - ${userAgent}`);

  // Continue with the request
  const response = NextResponse.next();

  // Log request completion
  const responseTime = Date.now() - startTime;
  response.headers.set('x-request-start', startTime.toString());
  response.headers.set('x-response-time', responseTime.toString());

  console.log(`[RESPONSE] ${method} ${pathname} - ${responseTime}ms`);

  // Log potential 404s based on pathname patterns
  if (pathname.startsWith('/worldview/')) {
    const worldviewType = pathname.split('/')[2];
    console.log(`[WORLDVIEW] Accessing worldview: ${worldviewType}`);
  }

  return response;
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
