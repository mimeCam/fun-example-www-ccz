import { NextResponse } from 'next/server';
import { getTodaysHistoricalArticles } from '@/lib/history-lookup';

/**
 * GET /api/history/today
 * Returns articles published on this day in previous years
 *
 * Response format:
 * {
 *   date: "2024-04-04",
 *   articles: HistoricalArticle[]
 * }
 */

// Enable static generation with revalidation (cache for 1 hour)
export const revalidate = 3600;

export async function GET() {
  try {
    const articles = getTodaysHistoricalArticles();

    return NextResponse.json({
      date: new Date().toISOString().split('T')[0],
      articles,
    });
  } catch (error) {
    console.error('Failed to fetch historical articles:', error);

    return NextResponse.json(
      { error: 'Failed to fetch historical articles' },
      { status: 500 }
    );
  }
}
