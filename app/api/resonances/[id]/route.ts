import { NextRequest, NextResponse } from 'next/server';
import {
  getResonanceById,
  updateResonance,
  archiveResonance,
  deleteResonance,
  recordResonanceVisit
} from '@/lib/resonances';
import { createEmailFingerprint } from '@/lib/reading-memory';
import { updateResonanceSchema } from '@/lib/validation';

/**
 * GET /api/resonances/[id]?email=user@example.com
 * Get a specific resonance by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const resonance = getResonanceById(params.id);

    // Verify ownership
    if (resonance.userId !== userId) {
      return NextResponse.json(
        { error: 'Resonance not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(resonance);
  } catch (error: any) {
    if (error.message === 'Resonance not found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    console.error('Failed to get resonance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/resonances/[id]
 * Update a resonance (note, quote, or status)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateResonanceSchema.parse(body);
    const userId = createEmailFingerprint(validatedData.email);

    // Update resonance
    const resonance = updateResonance(
      params.id,
      userId,
      {
        resonanceNote: validatedData.resonanceNote,
        quote: validatedData.quote,
        status: validatedData.status,
      }
    );

    return NextResponse.json(resonance);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message === 'Resonance not found or access denied') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    console.error('Failed to update resonance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/resonances/[id]?email=user@example.com
 * Archive or permanently delete a resonance
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const permanent = searchParams.get('permanent') === 'true';

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const userId = createEmailFingerprint(email);

    if (permanent) {
      // Permanently delete
      const success = deleteResonance(params.id, userId);
      if (!success) {
        return NextResponse.json(
          { error: 'Resonance not found or access denied' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    } else {
      // Archive (default behavior)
      const resonance = archiveResonance(params.id, userId);
      return NextResponse.json(resonance);
    }
  } catch (error: any) {
    console.error('Failed to delete resonance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/resonances/[id]/visit?email=user@example.com
 * Record a visit to a resonance (resets vitality)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const action = searchParams.get('action');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const userId = createEmailFingerprint(email);

    if (action === 'visit') {
      // Record visit and reset vitality
      const resonance = recordResonanceVisit(params.id, userId);
      return NextResponse.json(resonance);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    if (error.message === 'Resonance not found or access denied') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    console.error('Failed to record visit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// TODO: Add rate limiting for visit recording
// TODO: Add audit logging for resonance deletions
