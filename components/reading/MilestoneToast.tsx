/**
 * MilestoneToast Component - Reading milestone notification
 *
 * Displays celebratory toast notifications when user reaches reading milestones:
 * - 50%: "You're halfway there! 🎯"
 * - 100%: "You did it! Thanks for reading. 🎉"
 *
 * Design principles:
 * - Calm Technology: present without demanding attention
 * - Transient: auto-dismisses after 5 seconds
 * - Non-blocking: tap to dismiss, doesn't interrupt reading
 * - Positive reinforcement: achievement framing, not judgment
 *
 * Based on Tanya Donskaia's UX spec:
 * - Bottom-center positioning (above DepthBar)
 * - Translucent backdrop with blur effect
 * - Slide-up animation with fade
 * - Reuses existing FAB visual language
 */

'use client';

import { useEffect, useState } from 'react';
import type { Milestone } from '@/lib/utils/milestoneUtils';

interface MilestoneToastProps {
  milestone: Milestone | null;
  message: string;
  description: string;
  isVisible: boolean;
  onDismiss: () => void;
}

export function MilestoneToast({
  milestone,
  message,
  description,
  isVisible,
  onDismiss,
}: MilestoneToastProps) {
  const [shouldRender, setShouldRender] = useState(false);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      // Allow exit animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  if (!shouldRender) return null;

  const getIcon = (): string => {
    switch (milestone) {
      case 50:
        return '📖';
      case 100:
        return '🎉';
      default:
        return '✨';
    }
  };

  return (
    <div
      className={`fixed bottom-24 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-sm z-50 transition-all duration-300 ease-out ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-8 opacity-0'
      }`}
    >
      <div
        className="bg-surface/90 backdrop-blur-md rounded-2xl shadow-2xl border border-primary/30 px-6 py-4 cursor-pointer"
        onClick={onDismiss}
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <span className="text-2xl" role="img" aria-label="milestone icon">
            {getIcon()}
          </span>

          {/* Message content */}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-200">
              {message}
            </p>
            {description && (
              <p className="text-xs text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Optional: Visual indicator for tap-to-dismiss */}
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">Tap to dismiss</p>
        </div>
      </div>
    </div>
  );
}

// TODO: Add confetti burst animation for 100% milestone
// TODO: Add social proof count display ("47 readers finished this")
// TODO: Add share achievement action
// TODO: Add reduced motion support for accessibility
