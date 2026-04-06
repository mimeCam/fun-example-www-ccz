'use client';

import { useEffect, useState } from 'react';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';

/**
 * CommitmentNudges - Encouragement messages at strategic reading points
 *
 * Design principles:
 * - Non-intrusive encouragement
 * - Only appears after reader is engaged (>30 seconds)
 * - Context-aware messages based on progress
 * - Transient: auto-dismisses after 8 seconds
 * - Bottom-center positioning
 *
 * Based on Tanya Donskaia's UIX spec:
 * - "You're 2 minutes in... stick with it for the payoff!"
 * - Gold/amber accent for emphasis
 * - Translucent backdrop (8px shadow)
 * - Rounded corners (12px)
 * - Calm technology approach
 *
 * // TODO: Add topic-specific encouragement
 * // TODO: Add motivational quotes from the article
 * // TODO: Add reading streak reminders ("You're on fire! 5-day streak!")
 */

interface CommitmentNudgesProps {
  articleId: string;
  readingTime: number; // total reading time in minutes
}

interface NudgeMessage {
  threshold: number; // scroll percentage
  timeThreshold?: number; // minimum seconds reading
  message: string;
  icon?: string;
}

export function CommitmentNudges({
  articleId,
  readingTime,
}: CommitmentNudgesProps) {
  const { depth, isReading } = useScrollDepth();
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentNudge, setCurrentNudge] = useState<NudgeMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shownNudges, setShownNudges] = useState<Set<number>>(new Set());

  // Track reading time
  useEffect(() => {
    if (isReading) {
      const interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isReading]);

  // Define nudges based on reading time and scroll depth
  const getNudges = (): NudgeMessage[] => {
    const nudges: NudgeMessage[] = [];

    // Early engagement (after 30 seconds)
    if (readingTime >= 3) {
      nudges.push({
        threshold: 15,
        timeThreshold: 30,
        message: `Great start! In ${Math.round(readingTime * 0.6)} minutes you'll see the key insights.`,
        icon: '🌱',
      });
    }

    // Past the halfway point
    if (readingTime >= 5) {
      nudges.push({
        threshold: 40,
        timeThreshold: 90,
        message: "You're getting to the good stuff... keep going!",
        icon: '💡',
      });
    }

    // Approaching completion
    if (readingTime >= 7) {
      nudges.push({
        threshold: 70,
        timeThreshold: 180,
        message: `Almost there! ${Math.round((readingTime * 60 - timeElapsed) / 60)} minutes until the payoff.`,
        icon: '🎯',
      });
    }

    // Final stretch
    if (readingTime >= 10) {
      nudges.push({
        threshold: 85,
        timeThreshold: 300,
        message: "You're in the final stretch. Don't miss the conclusion!",
        icon: '🏃',
      });
    }

    return nudges;
  };

  // Check if we should show a nudge
  useEffect(() => {
    const nudges = getNudges();

    for (const nudge of nudges) {
      if (
        depth >= nudge.threshold &&
        (!nudge.timeThreshold || timeElapsed >= nudge.timeThreshold) &&
        !shownNudges.has(nudge.threshold)
      ) {
        setCurrentNudge(nudge);
        setShownNudges(prev => new Set([...prev, nudge.threshold]));
        setIsVisible(true);

        // Auto-dismiss after 8 seconds
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 8000);

        return () => clearTimeout(timer);
      }
    }
  }, [depth, timeElapsed, shownNudges]);

  if (!currentNudge || !isVisible) return null;

  return (
    <div className="fixed bottom-28 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-md z-50 transition-all duration-300 ease-out">
      <div className="bg-gradient-to-r from-amber-500/10 to-yellow-400/10 backdrop-blur-md rounded-xl border border-amber-500/30 shadow-lg px-5 py-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          {currentNudge.icon ? (
            <span className="text-2xl flex-shrink-0" role="img">
              {currentNudge.icon}
            </span>
          ) : (
            <span className="text-amber-400 flex-shrink-0 mt-0.5">✨</span>
          )}

          {/* Message */}
          <p className="text-sm text-gray-200 flex-1">{currentNudge.message}</p>

          {/* Dismiss button */}
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-200 transition-colors text-xs flex-shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// TODO: Add topic-specific nudge messages
// TODO: Add motivational quote extraction from article
// TODO: Add reading streak integration
// TODO: Add "break suggestion" for very long articles (>15 min)
