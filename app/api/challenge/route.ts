import { NextRequest, NextResponse } from 'next/server';
import { ChallengeModel } from '@/lib/models/challenge';
import { createChallengeSchema } from '@/lib/validation';
import { logError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createChallengeSchema.parse(body);

    // Create challenge
    const model = new ChallengeModel();
    const challenge = model.create(validatedData);

    return NextResponse.json(challenge, { status: 201 });
  } catch (error: any) {
    logError('POST /api/challenge: failed to create challenge', error instanceof Error ? error : new Error(String(error)));

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

