import { NextRequest, NextResponse } from 'next/server';
import { getAllTrails, getTrailById } from '@/lib/content/trail-data';
import { getAllArticles } from '@/lib/content/articleData';
import { populateTrailArticles } from '@/lib/content/trail-utils';

/**
 * Trails API - CuriosityTrail discovery and access
 *
 * Force dynamic rendering for searchParams support
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const trailId = searchParams.get('id');
  const populate = searchParams.get('populate') === 'true';

  // TODO: Add caching for performance
  // TODO: Add analytics tracking for trail engagement
  // TODO: Add user progress tracking integration

  // Get all articles for populating trail data
  const articles = getAllArticles();
  const getArticle = (id: string) => articles.find(a => a.id === id) || null;

  // Return specific trail if requested
  if (trailId) {
    const trail = getTrailById(trailId);

    if (!trail) {
      return NextResponse.json(
        { error: 'Trail not found' },
        { status: 404 }
      );
    }

    // Optionally populate with full article data
    if (populate) {
      const populatedTrail = populateTrailArticles(trail, getArticle);
      return NextResponse.json(populatedTrail);
    }

    return NextResponse.json(trail);
  }

  // Return all trails (optionally populated)
  const allTrails = getAllTrails();

  if (populate) {
    const populatedTrails = allTrails
      .map(trail => populateTrailArticles(trail, getArticle))
      .filter(trail => trail !== null);
    return NextResponse.json(populatedTrails);
  }

  return NextResponse.json(allTrails);
}
