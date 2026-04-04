/**
 * Admin API for Editor Picks
 * POST: Create/update editor picks
 * GET: Get all editor picks
 * DELETE: Delete an editor pick
 */

import { NextRequest, NextResponse } from 'next/server';
import { upsertEditorPick, deleteEditorPick, getAllEditorPicks } from '@/lib/db/editor-picks';

/**
 * POST /api/admin/editor-picks
 * Create or update an editor pick
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source_article_id, target_article_id, position, reason } = body;

    // Validate required fields
    if (!source_article_id || !target_article_id || position === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: source_article_id, target_article_id, position' },
        { status: 400 }
      );
    }

    // Validate position (1, 2, or 3)
    if (position < 1 || position > 3) {
      return NextResponse.json(
        { error: 'Position must be 1, 2, or 3' },
        { status: 400 }
      );
    }

    upsertEditorPick({
      source_article_id,
      target_article_id,
      position,
      reason: reason || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error upserting editor pick:', error);
    return NextResponse.json(
      { error: 'Failed to save editor pick' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/editor-picks
 * Get all editor picks
 */
export async function GET() {
  try {
    const allPicks = getAllEditorPicks();
    return NextResponse.json(allPicks);
  } catch (error) {
    console.error('Error getting editor picks:', error);
    return NextResponse.json(
      { error: 'Failed to get editor picks' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/editor-picks
 * Delete an editor pick
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source_article_id = searchParams.get('source_article_id');
    const position = searchParams.get('position');

    if (!source_article_id || !position) {
      return NextResponse.json(
        { error: 'Missing required parameters: source_article_id, position' },
        { status: 400 }
      );
    }

    deleteEditorPick(source_article_id, parseInt(position));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting editor pick:', error);
    return NextResponse.json(
      { error: 'Failed to delete editor pick' },
      { status: 500 }
    );
  }
}
