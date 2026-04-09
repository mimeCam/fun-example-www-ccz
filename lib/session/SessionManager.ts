/**
 * Session Manager - Track reader engagement for progressive content revelation
 *
 * Manages reader sessions to unlock bonus content based on time investment.
 * This module provides stateless functions for session lifecycle and engagement calculations.
 */

import { generateId } from '@/lib/utils/id';

export interface Session {
  id: string;
  startTime: number;
  articleId: string | null;
  unlocks: string[];
  lastUpdateTime: number;
}

/**
 * Create a new reader session with unique ID
 *
 * @returns A new session object with current timestamp
 *
 */
export function createSession(): Session {
  return {
    id: generateId(),
    startTime: Date.now(),
    articleId: null,
    unlocks: [],
    lastUpdateTime: Date.now(),
  };
}

/**
 * Calculate time spent on article in milliseconds
 *
 * @param session - The session to calculate time for
 * @returns Time elapsed since session start in milliseconds
 *
 */
export function getTimeOnPage(session: Session): number {
  return Date.now() - session.startTime;
}

/**
 * Get engagement level based on time investment
 *
 * @param session - The session to evaluate
 * @returns Engagement tier based on minutes spent
 *
 */
export function getEngagementLevel(session: Session): 'casual' | 'engaged' | 'deep' {
  const minutes = getTimeOnPage(session) / 60000;

  if (minutes >= 10) return 'deep';
  if (minutes >= 5) return 'engaged';
  return 'casual';
}

/**
 * Format milliseconds into human-readable time string
 *
 * @param ms - Time in milliseconds
 * @returns Formatted string (e.g., "5m 23s" or "45s")
 *
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
}

/**
 * Check if a content layer is unlocked for this session
 *
 * @param session - The session to check
 * @param layerId - The content layer ID to check
 * @returns true if the layer has been unlocked
 */
export function isLayerUnlocked(session: Session, layerId: string): boolean {
  return session.unlocks.includes(layerId);
}

/**
 * Mark a content layer as unlocked in the session
 *
 * @param session - The session to update
 * @param layerId - The content layer ID to unlock
 * @returns Updated session with the layer marked as unlocked
 *
 */
export function unlockLayer(session: Session, layerId: string): Session {
  if (session.unlocks.includes(layerId)) {
    return session; // Already unlocked
  }

  return {
    ...session,
    unlocks: [...session.unlocks, layerId],
    lastUpdateTime: Date.now(),
  };
}

/**
 * Update the session's article association
 *
 * @param session - The session to update
 * @param articleId - The article ID to associate with
 * @returns Updated session with article ID set
 *
 */
export function setArticleId(session: Session, articleId: string): Session {
  return {
    ...session,
    articleId,
    lastUpdateTime: Date.now(),
  };
}
