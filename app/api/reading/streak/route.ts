import { NextRequest, NextResponse } from 'next/server';
import {
  calculateStreak,
  createEmailFingerprint,
} from '@/lib/reading-memory';

/**
 * GET /api/reading/streak
 * Returns user's reading streak data
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email') ||
                  request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    const emailFingerprint = createEmailFingerprint(email);
    const streak = calculateStreak(emailFingerprint);

    return NextResponse.json({
      current: streak.current,
      longest: streak.longest,
      history: streak.history.map(date => date.toISOString()),
    });
  } catch (error: any) {
    console.error('Failed to get streak data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
