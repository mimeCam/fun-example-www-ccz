/**
 * API for Related Posts
 * GET: Get related posts for an article (includes editor picks + algorithmic)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRelatedPosts } from '@/lib/content/related-posts';

// Force dynamic rendering because this route requires searchParams at request time
export const dynamic = 'force-dynamic';

/**
 * GET /api/related-posts?articleId={id}
 * Get related posts for an article
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const articleId = searchParams.get('articleId');

    if (!articleId) {
      return NextResponse.json(
        { error: 'Missing articleId parameter' },
        { status: 400 }
      );
    }

    const relatedPosts = getRelatedPosts(articleId, 3);

    return NextResponse.json(relatedPosts);
  } catch (error) {
    console.error('Error getting related posts:', error);
    return NextResponse.json(
      { error: 'Failed to get related posts' },
      { status: 500 }
    );
  }
}
