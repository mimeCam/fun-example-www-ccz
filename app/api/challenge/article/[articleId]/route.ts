import { NextRequest, NextResponse } from 'next/server';
import { ChallengeModel } from '@/lib/models/challenge';

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
    // TODO: Add proper error logging
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// TODO: Add filtering by status
// TODO: Add pagination
