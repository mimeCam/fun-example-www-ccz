import { getDb } from './db';
import { generateId } from './utils/id';
import type { Feedback, FeedbackReason } from '@/types/feedback';

/**
 * Create a new feedback entry
 */
export function createFeedback(data: {
  postId: string;
  reason: FeedbackReason;
  comment?: string;
  timeOnPage?: number;
  scrollDepth?: number;
  userAgent?: string;
}): Feedback {
  const db = getDb();
  const id = generateId();
  const timestamp = Date.now();

  const feedback: Feedback = {
    id,
    postId: data.postId,
    timestamp,
    reason: data.reason,
    comment: data.comment,
    timeOnPage: data.timeOnPage,
    scrollDepth: data.scrollDepth,
    userAgent: data.userAgent,
  };

  const stmt = db.prepare(`
    INSERT INTO feedback (id, postId, timestamp, reason, comment, timeOnPage, scrollDepth, userAgent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    feedback.id,
    feedback.postId,
    feedback.timestamp,
    feedback.reason,
    feedback.comment || null,
    feedback.timeOnPage || null,
    feedback.scrollDepth || null,
    feedback.userAgent || null
  );

  return feedback;
}

/**
 * Get all feedback for a specific post
 */
export function getFeedbackByPost(postId: string): Feedback[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM feedback
    WHERE postId = ?
    ORDER BY timestamp DESC
  `);

  const rows = stmt.all(postId) as any[];
  return rows.map(row => ({
    id: row.id,
    postId: row.postId,
    timestamp: row.timestamp,
    reason: row.reason,
    comment: row.comment,
    timeOnPage: row.timeOnPage,
    scrollDepth: row.scrollDepth,
    userAgent: row.userAgent,
  }));
}

/**
 * Get feedback statistics grouped by reason
 */
export function getFeedbackStats(postId?: string): Record<string, number> {
  const db = getDb();

  let query = `
    SELECT reason, COUNT(*) as count
    FROM feedback
  `;

  const params: string[] = [];
  if (postId) {
    query += ' WHERE postId = ?';
    params.push(postId);
  }

  query += ' GROUP BY reason';

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as any[];

  const stats: Record<string, number> = {};
  for (const row of rows) {
    stats[row.reason] = row.count;
  }

  return stats;
}

/**
 * Check if feedback has been submitted recently (rate limiting)
 * Returns true if feedback was submitted in the last hour for this post
 */
export function hasRecentFeedback(postId: string, withinMinutes: number = 60): boolean {
  const db = getDb();
  const cutoffTime = Date.now() - withinMinutes * 60 * 1000;

  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM feedback
    WHERE postId = ? AND timestamp > ?
  `);

  const result = stmt.get(postId, cutoffTime) as any;
  return result.count > 0;
}
