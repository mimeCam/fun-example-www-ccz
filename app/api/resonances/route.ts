import { NextRequest, NextResponse } from 'next/server';
import {
  createResonance,
  getUserResonances,
  getUserDepthMetrics,
  getUserSlotLimit
} from '@/lib/resonances';
import { createEmailFingerprint } from '@/lib/reading-memory';
import { createResonanceSchema } from '@/lib/validation';
import { logError } from '@/lib/logger';

/**
 * POST /api/resonances
 * Create a new resonance with mandatory note
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createResonanceSchema.parse(body);
    const userId = createEmailFingerprint(validatedData.email);

    // Create resonance
    const resonance = createResonance(
      {
        articleId: validatedData.articleId,
        resonanceNote: validatedData.resonanceNote,
        quote: validatedData.quote,
      },
      userId
    );

    return NextResponse.json(resonance, { status: 201 });
  } catch (error: any) {
    logError('POST /api/resonances: failed to create resonance', error instanceof Error ? error : new Error(String(error)));

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    // Handle specific business logic errors
    if (error.message === 'Resonance note is required') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error.message === 'Resonance already exists for this article') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    if (error.message.includes('Slot limit reached')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 } // 429 Too Many Requests (slot limit)
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/resonances?email=user@example.com
 * Get all active resonances for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const userId = createEmailFingerprint(email);
    const resonances = getUserResonances(userId);

    // Get user metrics
    const metrics = getUserDepthMetrics(userId);
    const slots = getUserSlotLimit(userId);

    return NextResponse.json({
      resonances,
      metrics,
      slots,
    });
  } catch (error: any) {
    logError('GET /api/resonances: failed to get resonances', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

