/**
 * Reading Progress Hook - Track reader progress through content
 *
 * Provides real-time reading progress and time-to-completion estimates.
 * Uses reading time calculator to provide accurate predictions.
 *
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { getReadingStats } from '@/lib/utils/reading-time';

interface UseReadingProgressProps {
  content: string;
  wordsPerMinute?: number;
  onProgressChange?: (progress: number) => void;
}

export function useReadingProgress({
  content,
  wordsPerMinute = 225,
  onProgressChange,
}: UseReadingProgressProps) {
  const [timeSpent, setTimeSpent] = useState(0); // seconds
  const [progress, setProgress] = useState(0); // percentage
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Calculate reading time stats from content
  const readingStats = getReadingStats(content, wordsPerMinute);
  const estimatedSeconds = readingStats.minutes * 60;

  useEffect(() => {
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTimeSpent(elapsed);

        // Calculate progress percentage
        const newProgress = Math.min(100, (elapsed / estimatedSeconds) * 100);
        setProgress(newProgress);

        // Notify parent of progress changes
        if (onProgressChange) {
          onProgressChange(newProgress);
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [estimatedSeconds, onProgressChange]);

  /**
   * Format time spent as human-readable string
   *
   */
  const formatTimeSpent = (): string => {
    if (timeSpent < 60) return `${timeSpent}s`;
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  };

  /**
   * Calculate estimated time remaining
   *
   * @returns Formatted time remaining string
   *
   */
  const getTimeRemaining = (): string | null => {
    const remainingSeconds = estimatedSeconds - timeSpent;
    if (remainingSeconds <= 0) return null;

    if (remainingSeconds < 60) return `${remainingSeconds}s`;
    const minutes = Math.ceil(remainingSeconds / 60);
    return `${minutes} min`;
  };

  return {
    // Reading stats
    wordCount: readingStats.wordCount,
    estimatedReadTime: readingStats.formatted,
    estimatedMinutes: readingStats.minutes,

    // Real-time progress
    timeSpent,
    formattedTimeSpent: formatTimeSpent(),
    progress,
    timeRemaining: getTimeRemaining(),
    isComplete: progress >= 100,
  };
}
