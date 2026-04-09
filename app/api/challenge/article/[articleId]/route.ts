import { NextRequest, NextResponse } from 'next/server';
import { ChallengeModel } from '@/lib/models/challenge';
import { logError } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { articleId: string } }
) {
  try {
    const { articleId } = params;

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    const model = new ChallengeModel();
    const challenges = model.findByArticleId(articleId);

    return NextResponse.json(challenges);
  } catch (error: any) {
    logError('GET /api/challenge/article/[articleId]: failed to get challenges', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

