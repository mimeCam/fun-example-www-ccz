import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { z } from 'zod';

// Validation schema for highlight creation
const createHighlightSchema = z.object({
  articleId: z.string().min(1),
  text: z.string().min(3).max(500),
});

/**
 * POST /api/highlights
 * Create a new anonymous highlight
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = createHighlightSchema.parse(body);

    // Get client IP for basic rate limiting (optional)
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';

    // Get user agent for analytics (optional)
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Generate text hash for deduplication
    const textHash = Buffer.from(validatedData.text).toString('base64');

    const db = getDb();

    // Check if highlight already exists for this IP+text (prevent duplicate highlights)
    const existingHighlight = db.prepare(`
      SELECT id FROM highlights
      WHERE articleId = ? AND textHash = ? AND ipAddress = ?
    `).get(validatedData.articleId, textHash, ipAddress);

    if (existingHighlight) {
      return NextResponse.json(
        { error: 'Highlight already exists' },
        { status: 409 }
      );
    }

    // Create new highlight
    const result = db.prepare(`
      INSERT INTO highlights (articleId, text, textHash, ipAddress, userAgent)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      validatedData.articleId,
      validatedData.text,
      textHash,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      highlightId: result.lastInsertRowid,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating highlight:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// TODO: Add GET endpoint for fetching highlight counts by article
// TODO: Add rate limiting per IP to prevent abuse
// TODO: Add caching layer for frequently accessed highlight counts
