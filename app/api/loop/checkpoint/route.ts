/**
 * POST /api/loop/checkpoint — fire-and-forget reader-loop emit.
 *
 * Public, write-only, append-upsert. The natural rate limiter is the table's
 * `sessionId` PRIMARY KEY: a flooded session overwrites itself. Returns 204
 * on success so `navigator.sendBeacon` clients see the empty-body shape they
 * expect. Validation errors return 400 (and are not logged at error level —
 * a malformed beacon during shutdown is normal).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recordCheckpoint } from '@/lib/engagement/loop-funnel';
import {
  CHECKPOINTS, type CheckpointName,
} from '@/lib/engagement/loop-checkpoints';

export const dynamic = 'force-dynamic';

const CheckpointSchema = z.object({
  sessionId: z.string().min(1).max(128),
  articleId: z.string().min(1).max(128),
  checkpoint: z.enum([
    CHECKPOINTS.RESOLVED, CHECKPOINTS.WARMED,
    CHECKPOINTS.KEEPSAKED, CHECKPOINTS.SHARED,
  ]),
  archetype: z.string().min(1).max(64).nullish(),
});

/** Read the request body as JSON, tolerant of beacon-blob payloads. */
async function parseBody(req: NextRequest): Promise<unknown> {
  try { return await req.json(); }
  catch { return null; }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const raw = await parseBody(req);
  const parsed = CheckpointSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid checkpoint' }, { status: 400 });
  }
  const ok = recordCheckpoint({
    sessionId: parsed.data.sessionId,
    articleId: parsed.data.articleId,
    checkpoint: parsed.data.checkpoint as CheckpointName,
    archetype: parsed.data.archetype ?? null,
  });
  if (!ok) return NextResponse.json({ error: 'Persist failed' }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
