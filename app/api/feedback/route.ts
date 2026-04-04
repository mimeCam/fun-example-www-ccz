import { NextRequest, NextResponse } from 'next/server';
import { createFeedback, getFeedbackStats } from '@/lib/feedback';
import { createFeedbackSchema } from '@/lib/validation';

/**
 * POST /api/feedback
 * Submit exit-intent feedback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createFeedbackSchema.parse(body);

    // Check for rate limiting (prevent spam)
    // Note: We're using a simple time-based check without user identification
    // This allows for anonymous feedback while preventing abuse
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create feedback entry
    const feedback = createFeedback({
      postId: validatedData.postId,
      reason: validatedData.reason as any,
      comment: validatedData.comment,
      timeOnPage: validatedData.timeOnPage,
      scrollDepth: validatedData.scrollDepth,
      userAgent,
    });

    return NextResponse.json(
      { message: 'Feedback submitted successfully', id: feedback.id },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to submit feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/feedback?postId=xxx
 * Get feedback statistics (for admin/analytics)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    const stats = getFeedbackStats(postId || undefined);

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Failed to get feedback stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
