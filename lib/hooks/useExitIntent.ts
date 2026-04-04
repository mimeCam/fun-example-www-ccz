import { useState, useEffect, useRef } from 'react';
import { safeGetItem, safeSetItem } from '@/lib/utils/storage';

interface ExitIntentOptions {
  /** Minimum time on page before showing feedback (in milliseconds) */
  minTimeOnPage?: number;
  /** Minimum scroll depth before showing feedback (0-100) */
  minScrollDepth?: number;
  /** Storage key for rate limiting */
  storageKey?: string;
  /** Whether to show feedback */
  enabled?: boolean;
}

interface ExitIntentReturn {
  /** Whether the feedback modal should be shown */
  shouldShowFeedback: boolean;
  /** Dismiss the feedback modal */
  dismissFeedback: () => void;
  /** Track engagement metrics */
  metrics: {
    timeOnPage: number;
    scrollDepth: number;
  };
}

/**
 * Hook to detect exit intent and trigger feedback collection
 *
 * Features:
 * - Detects when user moves mouse to browser tab (desktop)
 * - Rate limiting via localStorage (once per session)
 * - Minimum engagement requirements (time on page, scroll depth)
 * - Tracks engagement metrics
 */
export function useExitIntent(options: ExitIntentOptions = {}): ExitIntentReturn {
  const {
    minTimeOnPage = 10000, // 10 seconds
    minScrollDepth = 10, // 10% scroll
    storageKey = 'exit-intent-feedback',
    enabled = true,
  } = options;

  const [shouldShowFeedback, setShouldShowFeedback] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [timeOnPage, setTimeOnPage] = useState(0);
  const [scrollDepth, setScrollDepth] = useState(0);

  const startTimeRef = useRef<number>(Date.now());
  const hasTrackedRef = useRef(false);

  // Track time on page
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setTimeOnPage(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled]);

  // Track scroll depth
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const depth = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollDepth(Math.min(depth, 100));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled]);

  // Check rate limiting on mount
  useEffect(() => {
    if (!enabled) return;

    const lastShown = safeGetItem<number>(storageKey);
    if (lastShown) {
      const timeSinceLastShown = Date.now() - lastShown;
      const oneHour = 60 * 60 * 1000;

      if (timeSinceLastShown < oneHour) {
        setHasShown(true);
      }
    }
  }, [storageKey, enabled]);

  // Handle exit intent detection
  useEffect(() => {
    if (!enabled || hasShown || hasTrackedRef.current) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Check if mouse left through the top of the viewport
      if (e.clientY <= 0) {
        // Check minimum engagement requirements
        if (timeOnPage >= minTimeOnPage && scrollDepth >= minScrollDepth) {
          setShouldShowFeedback(true);
          hasTrackedRef.current = true;

          // Mark as shown
          safeSetItem(storageKey, Date.now());
        }
      }
    };

    // Add mouseleave listener to document
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [
    enabled,
    hasShown,
    timeOnPage,
    scrollDepth,
    minTimeOnPage,
    minScrollDepth,
    storageKey,
  ]);

  const dismissFeedback = () => {
    setShouldShowFeedback(false);
  };

  return {
    shouldShowFeedback,
    dismissFeedback,
    metrics: {
      timeOnPage,
      scrollDepth,
    },
  };
}
