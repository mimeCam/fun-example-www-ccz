/**
 * Content Depth Engine - Progressive content revelation logic
 *
 * Determines which content layers should be unlocked based on reader engagement.
 * This module provides stateless functions for threshold checking and unlock logic.
 */

import type { Session } from '@/lib/session/SessionManager';
import type {
  ContentLayer,
  UnlockCheckResult,
} from '@/types/content';
import {
  getTimeOnPage,
  unlockLayer,
  isLayerUnlocked,
} from '@/lib/session/SessionManager';

/**
 * Check which content layers should be unlocked for the current session
 *
 * @param session - The current reader session
 * @param layers - All available content layers for the article
 * @returns Updated unlock status for all layers
 *
 * // TODO: Add scroll depth consideration in addition to time
 * // TODO: Add idle time exclusion (don't count inactive periods)
 */
export function checkUnlocks(
  session: Session,
  layers: ContentLayer[]
): ContentLayer[] {
  const minutes = getTimeOnPage(session) / 60000;

  return layers.map((layer) => ({
    ...layer,
    unlocked: minutes >= layer.thresholdMinutes,
  }));
}

/**
 * Perform a comprehensive unlock check and update session
 *
 * @param session - The current reader session
 * @param layers - All available content layers
 * @returns Result including updated session, layers, and newly unlocked IDs
 *
 * // TODO: Batch unlock multiple layers if time jumped significantly
 * // TODO: Add unlock cooldown to prevent spam checking
 */
export function performUnlockCheck(
  session: Session,
  layers: ContentLayer[]
): UnlockCheckResult {
  const updatedLayers = checkUnlocks(session, layers);
  const newlyUnlocked: string[] = [];
  let updatedSession = session;

  // Find and mark newly unlocked layers
  updatedLayers.forEach((layer) => {
    if (layer.unlocked && !isLayerUnlocked(session, layer.id)) {
      newlyUnlocked.push(layer.id);
      updatedSession = unlockLayer(updatedSession, layer.id);
    }
  });

  // Calculate time until next unlock
  const nextUnlockIn = calculateTimeToNextUnlock(updatedSession, layers);

  return {
    session: updatedSession,
    layers: updatedLayers,
    newlyUnlocked,
    nextUnlockIn,
  };
}

/**
 * Calculate milliseconds until the next content layer unlocks
 *
 * @param session - The current reader session
 * @param layers - All available content layers
 * @returns Milliseconds until next threshold, or undefined if all unlocked
 *
 * // TODO: Return null if no layers remain
 * // TODO: Add progress percentage toward next layer
 */
export function calculateTimeToNextUnlock(
  session: Session,
  layers: ContentLayer[]
): number | undefined {
  const currentTime = getTimeOnPage(session);
  const lockedLayers = layers.filter(
    (layer) => !isLayerUnlocked(session, layer.id)
  );

  if (lockedLayers.length === 0) {
    return undefined; // All layers unlocked
  }

  // Sort by threshold and find the next one
  const nextLayer = lockedLayers
    .sort((a, b) => a.thresholdMinutes - b.thresholdMinutes)[0];

  const nextThreshold = nextLayer.thresholdMinutes * 60000; // Convert to ms
  const remaining = nextThreshold - currentTime;

  return remaining > 0 ? remaining : 0;
}

/**
 * Filter layers to only include unlocked ones
 *
 * @param layers - All content layers
 * @returns Array of only unlocked layers
 *
 * // TODO: Add option to include preview teasers for locked content
 */
export function getUnlockedLayers(layers: ContentLayer[]): ContentLayer[] {
  return layers.filter((layer) => layer.unlocked);
}

/**
 * Get the next locked layer that will unlock
 *
 * @param session - The current reader session
 * @param layers - All content layers
 * @returns The next layer to unlock, or undefined if all unlocked
 *
 * // TODO: Return layer with progress percentage
 */
export function getNextLockedLayer(
  session: Session,
  layers: ContentLayer[]
): ContentLayer | undefined {
  const lockedLayers = layers.filter(
    (layer) => !isLayerUnlocked(session, layer.id)
  );

  if (lockedLayers.length === 0) {
    return undefined;
  }

  // Return the layer with the lowest threshold
  return lockedLayers.sort((a, b) => a.thresholdMinutes - b.thresholdMinutes)[0];
}

/**
 * Create unlock notification message for newly unlocked content
 *
 * @param layerId - ID of the newly unlocked layer
 * @param layers - All content layers to find the layer
 * @returns User-friendly message about the unlock
 *
 * // TODO: Add custom messages per layer type
 * // TODO: Add celebration for final layer unlock
 */
export function createUnlockMessage(
  layerId: string,
  layers: ContentLayer[]
): string {
  const layer = layers.find((l) => l.id === layerId);

  if (!layer) {
    return 'New content unlocked!';
  }

  return `🔓 "${layer.title}" is now available below`;
}
