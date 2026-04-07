/**
 * Resonance-First Bookmarking System
 * Handles CRUD operations for resonances with vitality tracking
 */

import { getDb } from '@/lib/db';
import { getArticleById } from '@/lib/content/articleData';
import type { ResonanceWithArticle } from '@/types/resonance-display';
import type {
  Resonance,
  CreateResonanceInput,
  UpdateResonanceInput,
  DepthMetrics,
  SlotLimits,
  ResonanceStatus
} from '@/types/resonance';
import { randomUUID } from 'crypto';

/**
 * Vitality threshold: above this = "carrying" (alive), below = "shaped" (faded)
 */
const VITALITY_CARRYING_THRESHOLD = 10;

const INITIAL_VITALITY_DAYS = 30;
const INITIAL_SLOT_LIMIT = 5;

/**
 * Create a new resonance with mandatory note
 */
export function createResonance(
  input: CreateResonanceInput,
  userId: string
): Resonance {
  const db = getDb();

  // Validate resonance note is not empty
  if (!input.resonanceNote || input.resonanceNote.trim().length === 0) {
    throw new Error('Resonance note is required');
  }

  // Check resonance note length (max 280 chars)
  if (input.resonanceNote.length > 280) {
    throw new Error('Resonance note must be 280 characters or less');
  }

  // Check if user already has a resonance for this article
  const existing = db.prepare(`
    SELECT id FROM resonances
    WHERE userId = ? AND articleId = ?
  `).get(userId, input.articleId);

  if (existing) {
    throw new Error('Resonance already exists for this article');
  }

  // Check slot limit
  const slotLimit = getUserSlotLimit(userId);
  if (slotLimit.usedSlots >= slotLimit.currentSlots) {
    throw new Error(
      `Slot limit reached (${slotLimit.currentSlots}). Archive or consider existing resonances first.`
    );
  }

  // Insert new resonance
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO resonances (
      id, userId, articleId, resonanceNote, quote, vitality, status,
      visitCount, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    input.articleId,
    input.resonanceNote.trim(),
    input.quote || null,
    INITIAL_VITALITY_DAYS,
    'active',
    0,
    now,
    now
  );

  return getResonanceById(id);
}

/**
 * Get resonance by ID
 */
export function getResonanceById(id: string): Resonance {
  const db = getDb();

  const row = db.prepare(`
    SELECT * FROM resonances WHERE id = ?
  `).get(id);

  if (!row) {
    throw new Error('Resonance not found');
  }

  return mapRowToResonance(row);
}

/**
 * Get all active resonances for a user
 */
export function getUserResonances(userId: string): Resonance[] {
  const db = getDb();

  const rows = db.prepare(`
    SELECT * FROM resonances
    WHERE userId = ? AND status = 'active'
    ORDER BY vitality ASC, createdAt DESC
  `).all(userId);

  return rows.map((row: any) => mapRowToResonance(row));
}

/**
 * Get all resonances (including archived) for a user
 */
export function getAllUserResonances(userId: string): Resonance[] {
  const db = getDb();

  const rows = db.prepare(`
    SELECT * FROM resonances
    WHERE userId = ?
    ORDER BY updatedAt DESC
  `).all(userId);

  return rows.map((row: any) => mapRowToResonance(row));
}

/**
 * Update an existing resonance
 */
export function updateResonance(
  id: string,
  userId: string,
  input: UpdateResonanceInput
): Resonance {
  const db = getDb();

  // Verify ownership
  const existing = db.prepare(`
    SELECT id FROM resonances WHERE id = ? AND userId = ?
  `).get(id, userId);

  if (!existing) {
    throw new Error('Resonance not found or access denied');
  }

  // Build update query dynamically
  const updates: string[] = [];
  const values: any[] = [];

  if (input.resonanceNote !== undefined) {
    if (input.resonanceNote.length > 280) {
      throw new Error('Resonance note must be 280 characters or less');
    }
    updates.push('resonanceNote = ?');
    values.push(input.resonanceNote.trim());
  }

  if (input.quote !== undefined) {
    updates.push('quote = ?');
    values.push(input.quote);
  }

  if (input.vitality !== undefined) {
    updates.push('vitality = ?');
    values.push(input.vitality);
  }

  if (input.status !== undefined) {
    updates.push('status = ?');
    values.push(input.status);
  }

  if (updates.length === 0) {
    return getResonanceById(id);
  }

  updates.push('updatedAt = ?');
  values.push(new Date().toISOString());
  values.push(id);
  values.push(userId);

  db.prepare(`
    UPDATE resonances
    SET ${updates.join(', ')}
    WHERE id = ? AND userId = ?
  `).run(...values);

  return getResonanceById(id);
}

/**
 * Record a visit to a resonance (resets vitality)
 */
export function recordResonanceVisit(id: string, userId: string): Resonance {
  const db = getDb();

  const result = db.prepare(`
    UPDATE resonances
    SET
      vitality = ?,
      visitCount = visitCount + 1,
      lastVisitedAt = ?,
      updatedAt = ?
    WHERE id = ? AND userId = ?
  `).run(
    INITIAL_VITALITY_DAYS,
    Date.now(),
    new Date().toISOString(),
    id,
    userId
  );

  if (result.changes === 0) {
    throw new Error('Resonance not found or access denied');
  }

  return getResonanceById(id);
}

/**
 * Archive a resonance (move to library instead of deletion)
 */
export function archiveResonance(id: string, userId: string): Resonance {
  return updateResonance(id, userId, { status: 'archived' });
}

/**
 * Consider a resonance (mark for potential discard)
 */
export function considerResonance(id: string, userId: string): Resonance {
  return updateResonance(id, userId, { status: 'considered' });
}

/**
 * Permanently delete a resonance
 */
export function deleteResonance(id: string, userId: string): boolean {
  const db = getDb();

  const result = db.prepare(`
    DELETE FROM resonances WHERE id = ? AND userId = ?
  `).run(id, userId);

  return result.changes > 0;
}

/**
 * Get user's slot limits with progressive unlocks
 */
export function getUserSlotLimit(userId: string): SlotLimits {
  const db = getDb();

  // Count active resonances
  const activeCount = db.prepare(`
    SELECT COUNT(*) as count FROM resonances
    WHERE userId = ? AND status = 'active'
  `).get(userId) as { count: number };

  // TODO: Implement progressive unlock logic
  // - Start with 5 slots
  // - +3 after 30 days of activity
  // - +5 at 70% return-visit rate
  // - +10 when 10 resonances aged 90+ days

  const currentSlots = INITIAL_SLOT_LIMIT;
  const usedSlots = activeCount.count;

  return {
    currentSlots,
    usedSlots,
    availableSlots: currentSlots - usedSlots,
  };
}

/**
 * Calculate depth metrics for a user
 */
export function getUserDepthMetrics(userId: string): DepthMetrics {
  const db = getDb();

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived,
      SUM(CASE WHEN visitCount > 0 THEN 1 ELSE 0 END) as visited,
      AVG(vitality) as avgVitality
    FROM resonances
    WHERE userId = ?
  `).get(userId) as any;

  const totalResonances = stats.total || 0;
  const visitedCount = stats.visited || 0;
  const returnVisitRate = totalResonances > 0
    ? Math.round((visitedCount / totalResonances) * 100)
    : 0;

  return {
    totalResonances,
    activeCount: stats.active || 0,
    archivedCount: stats.archived || 0,
    returnVisitRate,
    averageVitality: Math.round(stats.avgVitality || 0),
  };
}

/**
 * Process vitality decay (run daily via cron)
 * Decrements vitality and archives resonances at 0
 */
export function processVitalityDecay(): number {
  const db = getDb();

  // Decrement vitality for all active resonances
  db.prepare(`
    UPDATE resonances
    SET vitality = vitality - 1,
        updatedAt = datetime('now')
    WHERE status = 'active' AND vitality > 0
  `).run();

  // Archive resonances with depleted vitality
  const result = db.prepare(`
    UPDATE resonances
    SET status = 'archived',
        updatedAt = datetime('now')
    WHERE status = 'active' AND vitality <= 0
  `).run();

  return result.changes;
}

/**
 * Map database row to Resonance object
 */
function mapRowToResonance(row: any): Resonance {
  return {
    id: row.id,
    userId: row.userId,
    articleId: row.articleId,
    resonanceNote: row.resonanceNote,
    quote: row.quote,
    vitality: row.vitality,
    status: row.status as ResonanceStatus,
    visitCount: row.visitCount,
    lastVisitedAt: row.lastVisitedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Classify a resonance's vitality state for display.
 */
export { getVitalityLabel } from '@/types/resonance-display';
export type { ResonanceWithArticle } from '@/types/resonance-display';

/**
 * Get all active resonances for a user, joined with article titles.
 * Filters out resonances for articles that no longer exist.
 */
export function getResonancesWithArticles(userId: string): ResonanceWithArticle[] {
  const resonances = getUserResonances(userId);
  return resonances.reduce<ResonanceWithArticle[]>((acc, r) => {
    const article = getArticleById(r.articleId);
    if (article) acc.push({ ...r, articleTitle: article.title });
    return acc;
  }, []);
}

// TODO: Implement progressive unlock logic in getUserSlotLimit
