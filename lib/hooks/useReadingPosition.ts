'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'reading_position_';

interface ReadingPosition {
  scrollY: number;
  timestamp: number;
}

interface UseReadingPositionReturn {
  progress: number;
  hasStoredPosition: boolean;
  clearPosition: () => void;
}

/**
 * Hook to track and restore reading position for articles.
 * Uses localStorage to persist scroll position per article.
 *
 * @param articleId - Unique identifier for the article
 * @param enabled - Whether tracking is enabled (default: true)
 * @returns Object containing progress, hasStoredPosition, and clearPosition
 */
export function useReadingPosition(
  articleId: string,
  enabled: boolean = true
): UseReadingPositionReturn {
  const [progress, setProgress] = useState(0);
  const [hasStoredPosition, setHasStoredPosition] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastScrollYRef = useRef(0);
  const restoreAttemptedRef = useRef(false);

  // Generate storage key for this article
  const storageKey = `${STORAGE_KEY_PREFIX}${articleId}`;

  // Throttled save to localStorage
  const savePosition = useCallback((scrollY: number) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const position: ReadingPosition = {
        scrollY,
        timestamp: Date.now(),
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(position));
      } catch (error) {
        console.warn('Failed to save reading position:', error);
      }
    }, 500); // Save after 500ms of inactivity
  }, [storageKey]);

  // Restore position on mount
  useEffect(() => {
    if (!enabled || restoreAttemptedRef.current) return;

    const restorePosition = () => {
      try {
        const stored = localStorage.getItem(storageKey);

        if (stored) {
          const position: ReadingPosition = JSON.parse(stored);

          // Only restore if less than 30 days old
          const daysSinceStored = (Date.now() - position.timestamp) / (1000 * 60 * 60 * 24);

          if (daysSinceStored <= 30) {
            window.scrollTo({
              top: position.scrollY,
              behavior: 'instant',
            });

            setHasStoredPosition(true);
          } else {
            // Clear old positions
            localStorage.removeItem(storageKey);
          }
        }
      } catch (error) {
        console.warn('Failed to restore reading position:', error);
      } finally {
        restoreAttemptedRef.current = true;
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(restorePosition, 100);
  }, [storageKey, enabled]);

  // Track scroll position
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;

      // Calculate progress percentage
      const progressPercent = documentHeight > 0
        ? Math.min(100, Math.round((scrollY / documentHeight) * 100))
        : 0;

      setProgress(progressPercent);

      // Save position if scroll changed significantly (>10px)
      if (Math.abs(scrollY - lastScrollYRef.current) > 10) {
        savePosition(scrollY);
        lastScrollYRef.current = scrollY;
      }
    };

    // Initial calculation
    handleScroll();

    // Use passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Save final position on unmount
      savePosition(window.scrollY);
    };
  }, [enabled, savePosition]);

  // Clear stored position
  const clearPosition = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasStoredPosition(false);
    } catch (error) {
      console.warn('Failed to clear reading position:', error);
    }
  }, [storageKey]);

  return {
    progress,
    hasStoredPosition,
    clearPosition,
  };
}
