/**
 * /api/og/thread/[slug] — social unfurl for a Golden Thread keepsake.
 *
 * Uses the SAME pure SVG builder the client modal uses, so what the
 * reader screenshots and what Mastodon/Slack/Discord unfurl are the
 * same artifact. Mike §6.1: "one renderer, two runtimes."
 *
 * Accepts `?t=<base64url>` with a frozen ThreadSnapshot. Missing/broken
 * tokens render a default (dormant) thread — the unfurl never 500s.
 *
 * Note: we return raw SVG (not rasterized PNG) to avoid new dependencies
 * (`openloop/AGENTS.md`: no 3rd-party providers). Modern crawlers and
 * iOS/macOS link previews handle SVG. TODO: bundle-free PNG fallback when
 * a server-safe rasterizer lands in Next core.
 */
import { NextRequest, NextResponse } from 'next/server';
import { buildThreadSVG, clampSnapshot, type ThreadSnapshot } from '@/lib/sharing/thread-render';
import { decodeSnapshotToken, SNAPSHOT_QUERY_KEY } from '@/lib/sharing/thread-snapshot';

export const runtime = 'nodejs';          // pure string builder — no edge-only tricks
export const dynamic = 'force-dynamic';   // URL-driven; never static

const CACHE_HEADER = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';
const DEFAULT_TITLE = 'A thread formed here.';

function defaultSnapshot(slug: string): ThreadSnapshot {
  // Fallback artifact for bad/missing tokens — still on-brand, still shareable.
  return clampSnapshot({
    slug, title: DEFAULT_TITLE, depth: 30, thermal: 0.2,
    archetype: null, ts: Math.floor(Date.now() / 1000),
  })!;
}

function resolveSnapshot(slug: string, token: string | null): ThreadSnapshot {
  const decoded = decodeSnapshotToken(token);
  if (decoded && decoded.slug === slug) return decoded;    // matched — use as-is
  if (decoded) return { ...decoded, slug };                // slug mismatch — trust URL
  return defaultSnapshot(slug);
}

export async function GET(
  request: NextRequest,
  ctx: { params: { slug: string } },
) {
  const slug = decodeURIComponent(ctx.params.slug || '').slice(0, 120);
  if (!slug) {
    return NextResponse.json({ error: 'missing slug' }, { status: 400 });
  }
  const token = request.nextUrl.searchParams.get(SNAPSHOT_QUERY_KEY);
  const snapshot = resolveSnapshot(slug, token);
  const svg = buildThreadSVG(snapshot);
  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': CACHE_HEADER,
      // OG/Twitter crawlers sniff type; hint the rendered dimensions too.
      'X-Image-Dimensions': '1200x630',
    },
  });
}
