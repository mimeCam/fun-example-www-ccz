import { NextRequest, NextResponse } from 'next/server';
import { CommentModel } from '@/lib/models/comment';

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
    // TODO: Add proper error logging

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
