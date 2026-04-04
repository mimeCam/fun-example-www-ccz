import { NextRequest, NextResponse } from 'next/server';
import { CommentModel } from '@/lib/models/comment';
import { createCommentSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createCommentSchema.parse(body);

    // Create comment
    const model = new CommentModel();
    const comment = model.create(validatedData);

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    // TODO: Add proper error logging

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

// TODO: Add GET endpoint to retrieve comments (paginated?)
