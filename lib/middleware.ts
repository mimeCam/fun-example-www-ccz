/**
 * HTTP request logging middleware
 *
 * Captures HTTP requests and logs them for monitoring and debugging.
 * This helps identify 404 errors and other issues.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logHttp } from './logger';

/**
 * Middleware to log HTTP requests
 */
export function logHttpRequest(request: NextRequest, response: NextResponse) {
  const startTime = Date.now();
  const method = request.method;
  const url = request.url;

  // Calculate response time
  const responseTime = Date.now() - startTime;

  // Log the request
  logHttp(method, url, response.status, responseTime);

  return response;
}

/**
 * Extract useful request metadata for logging
 */
export function extractRequestMetadata(request: NextRequest): Record<string, any> {
  return {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    timestamp: new Date().toISOString(),
  };
}
