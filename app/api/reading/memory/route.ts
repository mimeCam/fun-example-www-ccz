import { NextRequest, NextResponse } from 'next/server';
import {
  getReadingHistory,
  getReadingStats,
  createEmailFingerprint,
  backfillReadingMemory,
} from '@/lib/reading-memory';

/**
 * GET /api/reading/memory
 * Returns user's complete reading memory including stats and history
 */
export async function GET(request: NextRequest) {
  try {
    // Get email from query parameter or header
    const email = request.headers.get('x-user-email') ||
                  request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    // Create email fingerprint for privacy
    const emailFingerprint = createEmailFingerprint(email);

    // Check if user has any reading memory, backfill if needed
    const history = getReadingHistory(emailFingerprint);

    if (history.length === 0) {
      // Try to backfill from existing sessions
      const backfilled = backfillReadingMemory(emailFingerprint);

      if (backfilled > 0) {
        console.log(`Backfilled ${backfilled} articles for user`);
      }
    }

    // Get fresh data after potential backfill
    const freshHistory = getReadingHistory(emailFingerprint);
    const stats = getReadingStats(emailFingerprint);

    return NextResponse.json({
      stats: {
        totalArticles: stats.totalArticles,
        totalReadingTime: stats.totalReadingTime,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
      },
      history: freshHistory.map(entry => ({
        articleId: entry.articleId,
        firstReadAt: new Date(entry.firstReadAt),
        lastReadAt: new Date(entry.lastReadAt),
        readCount: entry.readCount,
        totalReadingTime: entry.totalReadingTime,
        completionRate: entry.completionRate,
      })),
    });
  } catch (error: any) {
    console.error('Failed to get reading memory:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reading/memory
 * Records a new reading session
 */
export async function POST(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { articleId, readingTime, completionRate } = body;

    if (!articleId || typeof readingTime !== 'number' || typeof completionRate !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Import recordReadingSession
    const { recordReadingSession } = await import('@/lib/reading-memory');

    const emailFingerprint = createEmailFingerprint(email);
    const success = recordReadingSession(
      emailFingerprint,
      articleId,
      Math.floor(readingTime),
      Math.max(0, Math.min(1, completionRate))
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to record reading session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to record reading session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
