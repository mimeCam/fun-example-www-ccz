/**
 * Insight Capture & Share system
 * Handles CRUD operations for personal insights with sharing and social proof
 */

import { getDb } from '@/lib/db';
import type { Insight, CreateInsightInput } from '@/types/insight';
import { randomUUID } from 'crypto';

/**
 * Generate a text hash for deduplication
 */
function generateTextHash(text: string): string {
  return Buffer.from(text).toString('base64');
}

/**
 * Create a new insight
 */
export function createInsight(
  input: CreateInsightInput,
  userId: string
): Insight {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const textHash = generateTextHash(input.text);

  // Check if insight already exists for this user+article+text
  const existing = db.prepare(`
    SELECT id FROM insights
    WHERE userId = ? AND articleId = ? AND text = ?
  `).get(userId, input.articleId, input.text);

  if (existing) {
    throw new Error('Insight already exists');
  }

  // Insert new insight
  db.prepare(`
    INSERT INTO insights (
      id, userId, articleId, text, note, position, isPublic, captureCount, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    input.articleId,
    input.text,
    input.note || null,
    JSON.stringify(input.position),
    input.isPublic ? 1 : 0,
    1,
    now,
    now
  );

  return {
    id,
    userId,
    articleId: input.articleId,
    text: input.text,
    note: input.note,
    position: input.position,
    isPublic: input.isPublic ?? false,
    captureCount: 1,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get all insights for a user
 */
export function getUserInsights(userId: string): Insight[] {
  const db = getDb();

  const rows = db.prepare(`
    SELECT * FROM insights
    WHERE userId = ?
    ORDER BY createdAt DESC
  `).all(userId);

  return rows.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    articleId: row.articleId,
    text: row.text,
    note: row.note,
    position: JSON.parse(row.position),
    isPublic: row.isPublic === 1,
    captureCount: row.captureCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

/**
 * Get insights for an article with capture counts
 */
export function getArticleInsights(articleId: string): Insight[] {
  const db = getDb();

  const rows = db.prepare(`
    SELECT * FROM insights
    WHERE articleId = ? AND isPublic = 1
    ORDER BY captureCount DESC, createdAt DESC
  `).all(articleId);

  return rows.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    articleId: row.articleId,
    text: row.text,
    note: row.note,
    position: JSON.parse(row.position),
    isPublic: row.isPublic === 1,
    captureCount: row.captureCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

/**
 * Delete an insight
 */
export function deleteInsight(insightId: string, userId: string): boolean {
  const db = getDb();

  const result = db.prepare(`
    DELETE FROM insights
    WHERE id = ? AND userId = ?
  `).run(insightId, userId);

  return result.changes > 0;
}

// TODO: Add updateInsight function
// TODO: Add getInsightStats for capture counts
// TODO: Add caching layer for frequently accessed insights
