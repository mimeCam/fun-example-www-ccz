/**
 * Engagement Tracking - Persist session data to database
 *
 * Saves reader engagement sessions and layer unlock events for analytics.
 * This module provides server-side functions for storing engagement metrics.
 *
 * // TODO: Add batch insert for multiple unlock events
 * // TODO: Add aggregation queries for analytics dashboard
 */

import Database from 'better-sqlite3';
import type { Session } from '@/lib/session/SessionManager';
import type { SessionData } from '@/types/content';
import { getDb } from '@/lib/db';

/**
 * Save or update a session in the database
 *
 * @param session - The session to persist
 * @param deviceType - Optional device type for analytics
 * @returns true if successful
 *
 * // TODO: Add upsert logic to handle session updates
 * // TODO: Add validation to prevent duplicate sessions
 */
export function saveSession(
  session: Session,
  deviceType?: 'mobile' | 'tablet' | 'desktop'
): boolean {
  try {
    const db = getDb();

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO engagement_sessions
      (id, articleId, startTime, duration, unlocks, deviceType)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const duration = Date.now() - session.startTime;

    stmt.run(
      session.id,
      session.articleId || '',
      session.startTime,
      duration,
      session.unlocks.length,
      deviceType || null
    );

    return true;
  } catch (error) {
    console.error('Failed to save session:', error);
    return false;
  }
}

/**
 * Record a layer unlock event
 *
 * @param sessionId - Session identifier
 * @param articleId - Article identifier
 * @param layerId - Layer that was unlocked
 * @param thresholdMinutes - Threshold for this layer
 * @returns true if successful
 *
 * // TODO: Add deduplication to prevent duplicate unlock events
 */
export function recordLayerUnlock(
  sessionId: string,
  articleId: string,
  layerId: string,
  thresholdMinutes: number
): boolean {
  try {
    const db = getDb();

    // Get session start time to calculate time to unlock
    const sessionStmt = db.prepare(`
      SELECT startTime FROM engagement_sessions WHERE id = ?
    `);

    const session = sessionStmt.get(sessionId) as { startTime: number } | undefined;

    if (!session) {
      console.warn('Session not found:', sessionId);
      return false;
    }

    const timeToUnlock = Date.now() - session.startTime;

    const stmt = db.prepare(`
      INSERT INTO layer_unlocks
      (sessionId, articleId, layerId, thresholdMinutes, unlockedAt, timeToUnlock)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      sessionId,
      articleId,
      layerId,
      thresholdMinutes,
      Date.now(),
      timeToUnlock
    );

    return true;
  } catch (error) {
    console.error('Failed to record layer unlock:', error);
    return false;
  }
}

/**
 * Get engagement analytics for an article
 *
 * @param articleId - Article identifier
 * @returns Analytics data including unlock rates
 *
 * // TODO: Add completion rate calculation
 * // TODO: Add average time spent per layer
 */
export function getArticleAnalytics(articleId: string) {
  try {
    const db = getDb();

    // Get total sessions
    const sessionCountStmt = db.prepare(`
      SELECT COUNT(*) as count FROM engagement_sessions
      WHERE articleId = ?
    `);

    const { count: totalSessions } = sessionCountStmt.get(articleId) as { count: number };

    // Get unlock counts per layer
    const unlockCountsStmt = db.prepare(`
      SELECT
        layerId,
        thresholdMinutes,
        COUNT(*) as unlockCount,
        AVG(timeToUnlock) as avgTimeToUnlock
      FROM layer_unlocks
      WHERE articleId = ?
      GROUP BY layerId
      ORDER BY thresholdMinutes
    `);

    const layerStats = unlockCountsStmt.all(articleId) as Array<{
      layerId: string;
      thresholdMinutes: number;
      unlockCount: number;
      avgTimeToUnlock: number;
    }>;

    return {
      articleId,
      totalSessions,
      layerStats,
    };
  } catch (error) {
    console.error('Failed to get article analytics:', error);
    return null;
  }
}

/**
 * Get top-performing articles by engagement
 *
 * @param limit - Number of articles to return
 * @returns Array of article engagement metrics
 *
 * // TODO: Add date range filtering
 * // TODO: Add sorting by different metrics (avg time, completion rate)
 */
export function getTopArticles(limit: number = 10) {
  try {
    const db = getDb();

    const stmt = db.prepare(`
      SELECT
        articleId,
        COUNT(*) as sessionCount,
        AVG(duration) as avgDuration,
        AVG(unlocks) as avgUnlocks
      FROM engagement_sessions
      GROUP BY articleId
      ORDER BY avgDuration DESC
      LIMIT ?
    `);

    return stmt.all(limit);
  } catch (error) {
    console.error('Failed to get top articles:', error);
    return [];
  }
}

/**
 * Clean up old session data (maintenance function)
 *
 * @param daysToKeep - Number of days of history to retain
 * @returns Number of sessions deleted
 *
 * // TODO: Add scheduled cleanup job
 * // TODO: Add aggregation before deletion
 */
export function cleanupOldSessions(daysToKeep: number = 90): number {
  try {
    const db = getDb();

    const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

    const stmt = db.prepare(`
      DELETE FROM engagement_sessions
      WHERE startTime < ?
    `);

    const result = stmt.run(cutoffTime);
    return result.changes;
  } catch (error) {
    console.error('Failed to cleanup old sessions:', error);
    return 0;
  }
}
