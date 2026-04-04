/**
 * Milestone Utilities - Helper functions for reading milestone tracking
 *
 * These utilities support the Reading Milestone Tracker feature:
 * - Manages milestone state in localStorage
 * - Provides milestone-specific helper functions
 * - Handles milestone achievement tracking
 *
 * Based on team spec:
 * - 50% milestone: "You're halfway there! 🎯"
 * - 100% milestone: "You did it! Thanks for reading. 🎉"
 */

import { safeGetItem, safeSetItem } from './storage';

// Storage key for milestone data
const MILESTONE_STORAGE_KEY = 'reading-milestones';

// Milestone types
export type Milestone = 50 | 100;

// Milestone data structure
export interface MilestoneData {
  articleId: string;
  milestones: Milestone[];
  completedAt?: string; // ISO timestamp when 100% was reached
}

// Storage structure
interface MilestoneStorage {
  [articleId: string]: MilestoneData;
}

/**
 * Get milestone data for a specific article
 */
export function getMilestoneData(articleId: string): MilestoneData | null {
  const storage = safeGetItem<MilestoneStorage>(MILESTONE_STORAGE_KEY);
  return storage?.[articleId] || null;
}

/**
 * Save milestone data for a specific article
 */
export function saveMilestoneData(data: MilestoneData): boolean {
  const storage = safeGetItem<MilestoneStorage>(MILESTONE_STORAGE_KEY) || {};
  storage[data.articleId] = data;
  return safeSetItem(MILESTONE_STORAGE_KEY, storage);
}

/**
 * Check if a milestone has been reached
 */
export function hasReachedMilestone(articleId: string, milestone: Milestone): boolean {
  const data = getMilestoneData(articleId);
  return data?.milestones.includes(milestone) || false;
}

/**
 * Mark a milestone as reached
 */
export function markMilestoneReached(articleId: string, milestone: Milestone): boolean {
  const data = getMilestoneData(articleId) || {
    articleId,
    milestones: [],
  };

  // Only add if not already present
  if (!data.milestones.includes(milestone)) {
    data.milestones.push(milestone);

    // Mark completion timestamp for 100%
    if (milestone === 100) {
      data.completedAt = new Date().toISOString();
    }

    return saveMilestoneData(data);
  }

  return true; // Already marked
}

/**
 * Check if article has been completed (100% milestone)
 */
export function isArticleCompleted(articleId: string): boolean {
  return hasReachedMilestone(articleId, 100);
}

/**
 * Get milestone message for display
 */
export function getMilestoneMessage(milestone: Milestone): string {
  switch (milestone) {
    case 50:
      return "You're halfway there! 🎯";
    case 100:
      return "You did it! Thanks for reading. 🎉";
    default:
      return 'Milestone reached!';
  }
}

/**
 * Get milestone description (secondary text)
 */
export function getMilestoneDescription(milestone: Milestone): string {
  switch (milestone) {
    case 50:
      return 'The journey deepens...';
    case 100:
      return 'Join the fellow readers who finished this article';
    default:
      return '';
  }
}

/**
 * Calculate if progress percentage has reached a milestone
 * Uses a small buffer to ensure milestone is triggered
 */
export function hasMilestoneProgress(currentProgress: number, milestone: Milestone): boolean {
  const buffer = 0.5; // 0.5% buffer to prevent missing milestone
  return currentProgress >= (milestone - buffer);
}

// TODO: Add social proof count fetching
// TODO: Add milestone analytics tracking
// TODO: Add milestone celebration effects configuration
