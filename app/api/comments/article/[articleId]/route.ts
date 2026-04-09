import { NextRequest, NextResponse } from 'next/server';
import { CommentModel } from '@/lib/models/comment';
import { logError } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { articleId: string } }
) {
  try {
    const { articleId } = params;

    // Get comments for this article
    const model = new CommentModel();
    const comments = model.findByArticleId(articleId);

    return NextResponse.json(comments, { status: 200 });
  } catch (error: any) {
    logError('GET /api/comments/article/[articleId]: failed to get comments', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
