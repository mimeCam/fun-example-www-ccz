'use client';

import { useEffect, useState } from 'react';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';

/**
 * EnhancedProgressBar - Reading progress with time transparency
 *
 * Design principles:
 * - Fixed at top, always visible while reading
 * - Gradient-filled progress bar (visual appeal)
 * - Shows percentage AND time remaining
 * - Translucent backdrop with blur ("Pro" aesthetic)
 * - Smooth transitions
 *
 * Based on Tanya Donskaia's UIX spec:
 * - Gold/amber gradient for progress fill
 * - Muted text for time estimates
 * - "67% • 2 min left" format
 * - Shadow: 8px for UI elevation
 * - Rounded corners: 12px
 *
 * // TODO: Add milestone markers on the bar (25%, 50%, 75%)
 * // TODO: Add reading speed indicator (fast/medium/slow)
 * // TODO: Add confetti burst at 100% completion
 */

interface EnhancedProgressBarProps {
  articleId: string;
  totalReadingTime: number; // in minutes
}

export function EnhancedProgressBar({
  articleId,
  totalReadingTime,
}: EnhancedProgressBarProps) {
  const { depth, isReading, isFinished } = useScrollDepth();
  const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
  const [isVisible, setIsVisible] = useState(false);

  // Track reading session time
  useEffect(() => {
    if (isReading && !isFinished) {
      setIsVisible(true);
      const interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else if (isFinished) {
      // Fade out when finished
      const timer = setTimeout(() => setIsVisible(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isReading, isFinished]);

  if (!isVisible) return null;

  // Calculate time remaining
  const progressPercent = depth / 100;
  const totalTimeSeconds = totalReadingTime * 60;
  const estimatedRemaining = Math.max(
    0,
    Math.round(totalTimeSeconds * (1 - progressPercent) - timeElapsed)
  );

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.ceil(seconds / 60);
    return mins === 1 ? '1 min' : `${mins} min`;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-primary/20 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Progress percentage & time remaining */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-200 tabular-nums">
                {Math.round(depth)}%
              </span>
              <span className="text-xs text-gray-400 tabular-nums">
                {formatTime(estimatedRemaining)} left
              </span>
            </div>

            {/* Progress bar container */}
            <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
              {/* Gradient progress fill */}
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${depth}%` }}
              />
            </div>
          </div>

          {/* Quick stats - only show on larger screens */}
          <div className="hidden sm:block text-xs text-gray-400">
            <span>{formatTime(timeElapsed)} read</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// TODO: Add reading speed calculation and display
// TODO: Add milestone markers on progress bar
// TODO: Add "skimmable" sections indicator
// TODO: Add quick-jump to section on progress bar click
