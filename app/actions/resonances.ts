/**
 * Server Actions for Resonance-First Bookmarking System
 * These run on the server and can safely access the database
 */

'use server';

import {
  createResonance,
  getUserResonances,
  getUserDepthMetrics,
  getUserSlotLimit,
  updateResonance,
  archiveResonance,
  deleteResonance,
  recordResonanceVisit,
  getResonancesWithArticles
} from '@/lib/resonances';
import { createEmailFingerprint } from '@/lib/reading-memory';
import type {
  CreateResonanceInput,
  UpdateResonanceInput,
  Resonance,
  DepthMetrics,
  SlotLimits,
} from '@/types/resonance';
import type { ResonanceWithArticle } from '@/types/resonance-display';

/**
 * Create a new resonance (server action)
 * @param email - User email
 * @param articleId - Article ID
 * @param resonanceNote - Mandatory note about why it resonates
 * @param quote - Optional captured quote
 * @returns Created resonance or error
 */
export async function createResonanceAction(
  email: string,
  articleId: string,
  resonanceNote: string,
  quote?: string
): Promise<{ success: boolean; resonance?: Resonance; error?: string }> {
  try {
    const userId = createEmailFingerprint(email);
    const resonance = createResonance(
      { articleId, resonanceNote, quote },
      userId
    );
    return { success: true, resonance };
  } catch (error: any) {
    console.error('Error creating resonance:', error);
    return { success: false, error: error.message || 'Failed to create resonance' };
  }
}

/**
 * Get all active resonances for a user (server action)
 * @param email - User email
 * @returns Array of resonances
 */
export async function getUserResonancesAction(
  email: string
): Promise<{ success: boolean; resonances?: Resonance[]; error?: string }> {
  try {
    const userId = createEmailFingerprint(email);
    const resonances = getUserResonances(userId);
    return { success: true, resonances };
  } catch (error: any) {
    console.error('Error getting resonances:', error);
    return { success: false, error: error.message || 'Failed to get resonances' };
  }
}

/**
 * Get depth metrics for a user (server action)
 * @param email - User email
 * @returns Depth metrics
 */
export async function getDepthMetricsAction(
  email: string
): Promise<{ success: boolean; metrics?: DepthMetrics; error?: string }> {
  try {
    const userId = createEmailFingerprint(email);
    const metrics = getUserDepthMetrics(userId);
    return { success: true, metrics };
  } catch (error: any) {
    console.error('Error getting depth metrics:', error);
    return { success: false, error: error.message || 'Failed to get metrics' };
  }
}

/**
 * Get slot limits for a user (server action)
 * @param email - User email
 * @returns Slot limits
 */
export async function getSlotLimitsAction(
  email: string
): Promise<{ success: boolean; slots?: SlotLimits; error?: string }> {
  try {
    const userId = createEmailFingerprint(email);
    const slots = getUserSlotLimit(userId);
    return { success: true, slots };
  } catch (error: any) {
    console.error('Error getting slot limits:', error);
    return { success: false, error: error.message || 'Failed to get slot limits' };
  }
}

/**
 * Update a resonance (server action)
 * @param resonanceId - Resonance ID
 * @param email - User email
 * @param updates - Fields to update
 * @returns Updated resonance or error
 */
export async function updateResonanceAction(
  resonanceId: string,
  email: string,
  updates: Partial<UpdateResonanceInput>
): Promise<{ success: boolean; resonance?: Resonance; error?: string }> {
  try {
    const userId = createEmailFingerprint(email);
    const resonance = updateResonance(resonanceId, userId, updates);
    return { success: true, resonance };
  } catch (error: any) {
    console.error('Error updating resonance:', error);
    return { success: false, error: error.message || 'Failed to update resonance' };
  }
}

/**
 * Archive a resonance (server action)
 * @param resonanceId - Resonance ID
 * @param email - User email
 * @returns Archived resonance or error
 */
export async function archiveResonanceAction(
  resonanceId: string,
  email: string
): Promise<{ success: boolean; resonance?: Resonance; error?: string }> {
  try {
    const userId = createEmailFingerprint(email);
    const resonance = archiveResonance(resonanceId, userId);
    return { success: true, resonance };
  } catch (error: any) {
    console.error('Error archiving resonance:', error);
    return { success: false, error: error.message || 'Failed to archive resonance' };
  }
}

/**
 * Record a visit to a resonance (server action)
 * @param resonanceId - Resonance ID
 * @param email - User email
 * @returns Updated resonance with reset vitality or error
 */
export async function recordResonanceVisitAction(
  resonanceId: string,
  email: string
): Promise<{ success: boolean; resonance?: Resonance; error?: string }> {
  try {
    const userId = createEmailFingerprint(email);
    const resonance = recordResonanceVisit(resonanceId, userId);
    return { success: true, resonance };
  } catch (error: any) {
    console.error('Error recording visit:', error);
    return { success: false, error: error.message || 'Failed to record visit' };
  }
}

// TODO: Add server action for deleting resonances

/**
 * Get all active resonances for a user, enriched with article titles.
 * Returns resonances sorted for display (lowest vitality first = most urgent).
 */
export async function getResonancesWithArticleAction(
  email: string
): Promise<{ success: boolean; resonances?: ResonanceWithArticle[]; error?: string }> {
  try {
    const userId = createEmailFingerprint(email);
    const resonances = getResonancesWithArticles(userId);
    return { success: true, resonances };
  } catch (error: any) {
    console.error('Error getting resonances with articles:', error);
    return { success: false, error: error.message || 'Failed to get resonances' };
  }
}

/**
 * Get active resonances for a specific user + article pair.
 * Used by useResonanceMarginalia to render return-visit marginalia.
 */
export async function getResonancesForArticleAction(
  identifier: string,
  articleId: string
): Promise<{
  success: boolean;
  resonances?: { id: string; quote: string; resonanceNote: string; createdAt: string }[];
  error?: string;
}> {
  try {
    const userId = createEmailFingerprint(identifier);
    const all = getUserResonances(userId);
    const filtered = all
      .filter(r => r.articleId === articleId && r.quote)
      .map(r => ({
        id: r.id,
        quote: r.quote!,
        resonanceNote: r.resonanceNote,
        createdAt: r.createdAt,
      }));
    return { success: true, resonances: filtered };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch resonances' };
  }
}
