/**
 * useSessionProgress - React hook for progressive content revelation
 *
 * Manages reader session and automatically checks for content unlocks
 * based on time investment. Provides session state and unlocked content layers.
 *
 * // TODO: Add localStorage persistence for session state
 * // TODO: Add analytics tracking for unlock events
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session } from '@/lib/session/SessionManager';
import type {
  ContentLayer,
  UnlockCheckResult,
} from '@/types/content';
import {
  createSession,
  getTimeOnPage,
  formatDuration,
  setArticleId,
} from '@/lib/session/SessionManager';
import {
  performUnlockCheck,
  createUnlockMessage,
} from '@/lib/content/DepthEngine';
import { safeGetItem, safeSetItem } from '@/lib/utils/storage';

const STORAGE_KEY_PREFIX = 'session_progress_';
const CHECK_INTERVAL_MS = 5000; // Check every 5 seconds

interface UseSessionProgressProps {
  articleId: string;
  depthLayers: ContentLayer[];
}

interface UseSessionProgressReturn {
  session: Session;
  unlockedLayers: ContentLayer[];
  nextUnlockIn: number | undefined;
  timeOnPage: string;
  engagementLevel: 'casual' | 'engaged' | 'deep';
  newlyUnlockedMessages: string[];
  clearMessages: () => void;
}

/**
 * Hook for managing progressive content revelation
 *
 * @param props.articleId - Article identifier
 * @param props.depthLayers - Available depth layers for this article
 * @returns Session state and unlocked content
 *
 * // TODO: Add error boundary for corrupted session data
 * // TODO: Add session expiry (e.g., 24 hours)
 */
export function useSessionProgress({
  articleId,
  depthLayers,
}: UseSessionProgressProps): UseSessionProgressReturn {
  const [session, setSession] = useState<Session>(() => {
    // Try to load existing session from localStorage
    const saved = safeGetItem<Session>(`${STORAGE_KEY_PREFIX}${articleId}`);

    if (saved) {
      return setArticleId(saved, articleId);
    }

    // Create new session
    const newSession = createSession();
    return setArticleId(newSession, articleId);
  });

  const [unlockedLayers, setUnlockedLayers] = useState<ContentLayer[]>([]);
  const [nextUnlockIn, setNextUnlockIn] = useState<number | undefined>();
  const [newlyUnlockedMessages, setNewlyUnlockedMessages] = useState<string[]>([]);

  // Use ref to avoid stale closure in interval
  const sessionRef = useRef(session);
  const layersRef = useRef(depthLayers);

  // Update refs when props change
  useEffect(() => {
    sessionRef.current = session;
    layersRef.current = depthLayers;
  }, [session, depthLayers]);

  /**
   * Check for unlocks and update state
   */
  const checkAndUpdateUnlocks = useCallback(() => {
    const result: UnlockCheckResult = performUnlockCheck(
      sessionRef.current,
      layersRef.current
    );

    // Update session if new unlocks occurred
    if (result.newlyUnlocked.length > 0) {
      setSession(result.session);

      // Create notification messages
      const messages = result.newlyUnlocked.map((id) =>
        createUnlockMessage(id, layersRef.current)
      );
      setNewlyUnlockedMessages((prev) => [...prev, ...messages]);

      // Persist to localStorage
      safeSetItem(`${STORAGE_KEY_PREFIX}${articleId}`, result.session);
    }

    // Update unlocked layers
    setUnlockedLayers(
      result.layers.filter((layer) => layer.unlocked)
    );

    // Update next unlock time
    setNextUnlockIn(result.nextUnlockIn);
  }, [articleId]);

  /**
   * Clear notification messages
   */
  const clearMessages = useCallback(() => {
    setNewlyUnlockedMessages([]);
  }, []);

  // Set up periodic unlock checking
  useEffect(() => {
    // Initial check
    checkAndUpdateUnlocks();

    const interval = setInterval(checkAndUpdateUnlocks, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [checkAndUpdateUnlocks]);

  // Save session on unmount
  useEffect(() => {
    return () => {
      safeSetItem(`${STORAGE_KEY_PREFIX}${articleId}`, session);
    };
  }, [articleId, session]);

  // Calculate engagement level
  const engagementLevel: 'casual' | 'engaged' | 'deep' =
    getTimeOnPage(session) >= 600000 ? 'deep' :
    getTimeOnPage(session) >= 300000 ? 'engaged' : 'casual';

  return {
    session,
    unlockedLayers,
    nextUnlockIn,
    timeOnPage: formatDuration(getTimeOnPage(session)),
    engagementLevel,
    newlyUnlockedMessages,
    clearMessages,
  };
}
