/**
 * GET /api/loop/funnel — internal weekly aggregate of the reader loop.
 *
 * Gated by an env-token header check (`x-loop-funnel-token`) that matches
 * `LOOP_FUNNEL_TOKEN`. No admin UI this sprint — the JSON is enough to
 * decide "is the curve moving?" on week one. Each successful read emits
 * one winston `info` log line with the latest week's totals — the
 * observability budget Mike specified in §6.10.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyFunnel, type WeeklyFunnelRow } from '@/lib/engagement/loop-funnel';
import { logInfo } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const TOKEN_HEADER = 'x-loop-funnel-token';
const DEFAULT_WINDOW_DAYS = 28;

/** Constant-time-ish env-token compare. Empty env => endpoint disabled. */
function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.LOOP_FUNNEL_TOKEN;
  if (!expected) return false;
  const provided = req.headers.get(TOKEN_HEADER);
  return !!provided && provided === expected;
}

/** Clamp the `days` query param to a safe window. Defaults to 28. */
function readWindowDays(req: NextRequest): number {
  const raw = req.nextUrl.searchParams.get('days');
  const n = raw ? Number.parseInt(raw, 10) : DEFAULT_WINDOW_DAYS;
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_WINDOW_DAYS;
  return Math.min(n, 365);
}

/** Log only the latest-week aggregates — never raw rows, never PII. */
function logSummary(rows: WeeklyFunnelRow[], days: number): void {
  const latest = rows[0];
  logInfo('loop-funnel.read', {
    days, weeks: rows.length, latest: latest ?? null,
  });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const days = readWindowDays(req);
  const rows = getWeeklyFunnel(days);
  logSummary(rows, days);
  return NextResponse.json({ days, rows });
}
