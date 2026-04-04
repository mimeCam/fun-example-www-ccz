/**
 * Reading Progress Display - Show reading time and progress
 *
 * Simple component to display reading time investment and progress.
 * Helps readers manage their time and track completion.
 *
 * // TODO: Add compact mode for mobile
 * // TODO: Add option to hide progress bar
 * // TODO: Add visual completion celebration
 * // TODO: Respect prefers-reduced-motion for progress bar animation
 */

'use client';

import { useReadingProgress } from '@/lib/hooks/useReadingProgress';

interface ReadingProgressProps {
  content: string;
  wordsPerMinute?: number;
  showProgressBar?: boolean;
  className?: string;
}

export function ReadingProgress({
  content,
  wordsPerMinute = 225,
  showProgressBar = true,
  className = '',
}: ReadingProgressProps) {
  const {
    formattedTimeSpent,
    estimatedReadTime,
    progress,
    timeRemaining,
    isComplete,
  } = useReadingProgress({ content, wordsPerMinute });

  return (
    <div className={`text-sm text-gray-400 ${className}`}>
      {/* Time summary */}
      <div className="flex items-center gap-2">
        <span>📖</span>
        <span>
          Time invested: <span className="font-bold text-white">{formattedTimeSpent}</span>
          {estimatedReadTime && (
            <>
              {' · '}
              Est. read time: <span className="text-gray-300">{estimatedReadTime}</span>
            </>
          )}
        </span>
      </div>

      {/* Progress bar */}
      {showProgressBar && !isComplete && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Reading progress</span>
            {timeRemaining && (
              <span>
                ~{timeRemaining} remaining
              </span>
            )}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, progress)}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Reading progress: ${Math.round(progress)}% complete`}
            />
          </div>
        </div>
      )}

      {/* Complete message */}
      {isComplete && (
        <div className="mt-2 text-xs text-green-400">
          ✓ Completed! Thanks for reading.
        </div>
      )}
    </div>
  );
}

/**
 * Compact variant for tight spaces (sidebar, mobile)
 *
 * // TODO: Add click to expand full details
 * // TODO: Add visual indicator when approaching completion
 */
export function CompactReadingProgress({
  content,
  wordsPerMinute = 225,
  className = '',
}: Pick<ReadingProgressProps, 'content' | 'wordsPerMinute' | 'className'>) {
  const { formattedTimeSpent, progress, isComplete } = useReadingProgress({
    content,
    wordsPerMinute,
  });

  return (
    <div className={`text-xs text-gray-400 ${className}`}>
      <span className="font-bold text-white">{formattedTimeSpent}</span>
      {!isComplete && (
        <span className="ml-2 text-gray-500">
          ({Math.round(progress)}%)
        </span>
      )}
    </div>
  );
}
