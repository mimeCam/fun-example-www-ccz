import { NextRequest, NextResponse } from 'next/server';
import { getSearchIndex, searchArticles } from '@/lib/search/searchIndex';

/**
 * Enhanced Search API route with fuzzy matching
 * Uses Fuse.js for intelligent search with relevance ranking
 *
 * Force dynamic rendering because this route requires searchParams at request time
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    const searchIndex = getSearchIndex();
    const results = searchArticles(searchIndex, query);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
