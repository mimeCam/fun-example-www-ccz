import { NextRequest, NextResponse } from 'next/server';
import { CommentModel } from '@/lib/models/comment';
import { createCommentUpvoteSchema } from '@/lib/validation';
import { logError } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const commentId = parseInt(params.commentId, 10);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = createCommentUpvoteSchema.parse({
      ...body,
      commentId,
    });

    // Create upvote
    const model = new CommentModel();
    const upvote = model.upvote(validatedData);

    return NextResponse.json(upvote, { status: 201 });
  } catch (error: any) {
    logError('POST /api/comments/[commentId]/upvote: failed to upvote comment', error instanceof Error ? error : new Error(String(error)));

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

