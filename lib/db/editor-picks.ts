/**
 * Editor Picks Database Layer
 * Manages author-curated related posts
 */

import { getDb } from '../db';

export interface EditorPick {
  id?: number;
  source_article_id: string;
  target_article_id: string;
  position: number;
  reason?: string;
  created_at?: string;
}

/**
 * Get all editor picks for a specific article
 * @param sourceArticleId - The article ID to get picks for
 * @returns Array of editor picks ordered by position
 */
export function getEditorPicks(sourceArticleId: string): EditorPick[] {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT
      id,
      source_article_id,
      target_article_id,
      position,
      reason,
      created_at
    FROM editor_picks
    WHERE source_article_id = ?
    ORDER BY position ASC
  `);

  return stmt.all(sourceArticleId) as EditorPick[];
}

/**
 * Upsert an editor pick (insert or update)
 * @param pick - The editor pick to save
 */
export function upsertEditorPick(pick: EditorPick): void {
  const db = getDb();

  const stmt = db.prepare(`
    INSERT INTO editor_picks (source_article_id, target_article_id, position, reason)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(source_article_id, position) DO UPDATE SET
      target_article_id = excluded.target_article_id,
      reason = excluded.reason
  `);

  stmt.run(pick.source_article_id, pick.target_article_id, pick.position, pick.reason || null);
}

/**
 * Delete an editor pick
 * @param sourceArticleId - The source article ID
 * @param position - The position to delete (1, 2, or 3)
 */
export function deleteEditorPick(sourceArticleId: string, position: number): void {
  const db = getDb();

  const stmt = db.prepare(`
    DELETE FROM editor_picks
    WHERE source_article_id = ? AND position = ?
  `);

  stmt.run(sourceArticleId, position);
}

/**
 * Get all editor picks (for admin interface)
 * @returns All editor picks grouped by source article
 */
export function getAllEditorPicks(): Record<string, EditorPick[]> {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT
      id,
      source_article_id,
      target_article_id,
      position,
      reason,
      created_at
    FROM editor_picks
    ORDER BY source_article_id, position ASC
  `);

  const picks = stmt.all() as EditorPick[];

  // Group by source article
  const grouped: Record<string, EditorPick[]> = {};
  for (const pick of picks) {
    if (!grouped[pick.source_article_id]) {
      grouped[pick.source_article_id] = [];
    }
    grouped[pick.source_article_id].push(pick);
  }

  return grouped;
}
