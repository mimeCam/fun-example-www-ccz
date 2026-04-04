/**
 * Reading Memory - Personal reading history and analytics
 *
 * Provides utilities for tracking reader engagement over time,
 * computing streaks, and generating personalized insights.
 */

import { getDb } from '@/lib/db';
import crypto from 'crypto';

/**
 * Reading memory entry for a specific article
 */
export interface ReadingMemoryEntry {
  id: number;
  emailFingerprint: string;
  articleId: string;
  firstReadAt: number;
  lastReadAt: number;
  readCount: number;
  totalReadingTime: number; // seconds
  completionRate: number; // 0.0 to 1.0
}

/**
 * Timeline item for visualization
 */
export interface TimelineItem {
  articleId: string;
  title: string;
  date: Date;
  readingTime: number; // seconds
  topic?: string;
}

/**
 * Topic statistics
 */
export interface TopicStats {
  topic: string;
  count: number;
  lastRead: Date;
  percentage: number;
}

/**
 * Streak data
 */
export interface StreakData {
  current: number;
  longest: number;
  history: Date[];
}

/**
 * Overall reading memory statistics
 */
export interface ReadingMemoryStats {
  totalArticles: number;
  totalReadingTime: number; // seconds
  currentStreak: number;
  longestStreak: number;
}

/**
 * Create privacy-preserving email fingerprint
 *
 * @param email - User email address
 * @returns SHA-256 hash (first 16 chars)
 */
export function createEmailFingerprint(email: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(email + 'persona-blog-salt');
  return hash.digest('hex').substring(0, 16);
}

/**
 * Backfill reading memory from existing engagement sessions
 * Aggregates sessions by article to create initial memory entries
 *
 * @param emailFingerprint - User's email fingerprint
 * @returns Number of entries created
 */
export function backfillReadingMemory(emailFingerprint: string): number {
  const db = getDb();

  // Get all sessions for this user (grouped by article)
  const sessionsStmt = db.prepare(`
    SELECT
      articleId,
      MIN(startTime) as firstRead,
      MAX(startTime) as lastRead,
      COUNT(*) as readCount,
      SUM(duration) as totalTime,
      AVG(CAST(unlocks AS REAL) / 3) as avgCompletion
    FROM engagement_sessions
    WHERE articleId != ''
    GROUP BY articleId
    ORDER BY lastRead DESC
  `);

  const sessions = sessionsStmt.all() as Array<{
    articleId: string;
    firstRead: number;
    lastRead: number;
    readCount: number;
    totalTime: number;
    avgCompletion: number;
  }>;

  let created = 0;

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO reading_memory
    (emailFingerprint, articleId, firstReadAt, lastReadAt, readCount, totalReadingTime, completionRate)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const session of sessions) {
    try {
      insertStmt.run(
        emailFingerprint,
        session.articleId,
        session.firstRead,
        session.lastRead,
        session.readCount,
        Math.floor(session.totalTime / 1000), // Convert ms to seconds
        Math.min(1.0, Math.max(0.0, session.avgCompletion))
      );
      created++;
    } catch (error) {
      console.warn('Failed to backfill article:', session.articleId, error);
    }
  }

  return created;
}

/**
 * Get reading history for a user
 *
 * @param emailFingerprint - User's email fingerprint
 * @returns Array of reading memory entries
 */
export function getReadingHistory(emailFingerprint: string): ReadingMemoryEntry[] {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT * FROM reading_memory
    WHERE emailFingerprint = ?
    ORDER BY lastReadAt DESC
  `);

  const rows = stmt.all(emailFingerprint) as any[];
  return rows.map(row => ({
    id: row.id,
    emailFingerprint: row.emailFingerprint,
    articleId: row.articleId,
    firstReadAt: row.firstReadAt,
    lastReadAt: row.lastReadAt,
    readCount: row.readCount,
    totalReadingTime: row.totalReadingTime,
    completionRate: row.completionRate,
  }));
}

/**
 * Get overall reading statistics for a user
 *
 * @param emailFingerprint - User's email fingerprint
 * @returns Reading memory statistics
 */
export function getReadingStats(emailFingerprint: string): ReadingMemoryStats {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT
      COUNT(*) as totalArticles,
      SUM(totalReadingTime) as totalReadingTime
    FROM reading_memory
    WHERE emailFingerprint = ?
  `);

  const result = stmt.get(emailFingerprint) as {
    totalArticles: number;
    totalReadingTime: number;
  } | undefined;

  const streak = calculateStreak(emailFingerprint);

  return {
    totalArticles: result?.totalArticles || 0,
    totalReadingTime: result?.totalReadingTime || 0,
    currentStreak: streak.current,
    longestStreak: streak.longest,
  };
}

/**
 * Calculate reading streaks (consecutive days with activity)
 *
 * @param emailFingerprint - User's email fingerprint
 * @returns Streak data
 */
export function calculateStreak(emailFingerprint: string): StreakData {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT DISTINCT DATE(lastReadAt / 1000, 'unixepoch') as readDate
    FROM reading_memory
    WHERE emailFingerprint = ?
    ORDER BY readDate DESC
  `);

  const rows = stmt.all(emailFingerprint) as Array<{ readDate: string }>;

  if (rows.length === 0) {
    return { current: 0, longest: 0, history: [] };
  }

  const dates = rows.map(r => new Date(r.readDate));
  let current = 1;
  let longest = 1;

  // Calculate current streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mostRecent = new Date(dates[0]);
  mostRecent.setHours(0, 0, 0, 0);

  const dayDiff = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff > 1) {
    current = 0; // Streak broken
  } else {
    for (let i = 0; i < dates.length - 1; i++) {
      const currDate = new Date(dates[i]);
      const nextDate = new Date(dates[i + 1]);
      currDate.setHours(0, 0, 0, 0);
      nextDate.setHours(0, 0, 0, 0);

      const diff = Math.floor((currDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diff === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let tempStreak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const currDate = new Date(dates[i]);
    const nextDate = new Date(dates[i + 1]);
    currDate.setHours(0, 0, 0, 0);
    nextDate.setHours(0, 0, 0, 0);

    const diff = Math.floor((currDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      tempStreak++;
      longest = Math.max(longest, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return { current, longest, history: dates };
}

/**
 * Record a reading session
 * Updates or creates reading memory entry for an article
 *
 * @param emailFingerprint - User's email fingerprint
 * @param articleId - Article identifier
 * @param readingTime - Time spent reading in seconds
 * @param completionRate - Completion rate (0.0 to 1.0)
 * @returns true if successful
 */
export function recordReadingSession(
  emailFingerprint: string,
  articleId: string,
  readingTime: number,
  completionRate: number
): boolean {
  const db = getDb();

  try {
    // Check if entry exists
    const checkStmt = db.prepare(`
      SELECT id, readCount, totalReadingTime FROM reading_memory
      WHERE emailFingerprint = ? AND articleId = ?
    `);

    const existing = checkStmt.get(emailFingerprint, articleId) as {
      id: number;
      readCount: number;
      totalReadingTime: number;
    } | undefined;

    if (existing) {
      // Update existing entry
      const updateStmt = db.prepare(`
        UPDATE reading_memory
        SET
          lastReadAt = ?,
          readCount = readCount + 1,
          totalReadingTime = totalReadingTime + ?,
          completionRate = (completionRate + ?) / 2
        WHERE id = ?
      `);

      updateStmt.run(
        Date.now(),
        readingTime,
        completionRate,
        existing.id
      );
    } else {
      // Create new entry
      const insertStmt = db.prepare(`
        INSERT INTO reading_memory
        (emailFingerprint, articleId, firstReadAt, lastReadAt, readCount, totalReadingTime, completionRate)
        VALUES (?, ?, ?, ?, 1, ?, ?)
      `);

      insertStmt.run(
        emailFingerprint,
        articleId,
        Date.now(),
        Date.now(),
        readingTime,
        completionRate
      );
    }

    return true;
  } catch (error) {
    console.error('Failed to record reading session:', error);
    return false;
  }
}
