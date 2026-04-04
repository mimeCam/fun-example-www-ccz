'use client';

import { useState, useEffect } from 'react';
import { scrollToPosition } from '@/lib/utils/scrollUtils';

interface JumpToPositionButtonProps {
  articleId: string;
  storedProgress: number; // Progress percentage (0-100)
  isVisible: boolean; // Whether the button should be visible
  onJump?: () => void; // Optional callback after jumping
}

/**
 * JumpToPositionButton - Quick navigation to saved reading position
 *
 * Design Philosophy:
 * - Utility-first: Solves "Where did I leave off?"
 * - Non-intrusive: Only shows when needed
 * - One-click action: Instant position restoration
 * - Context-aware: Shows position percentage
 *
 * Based on team recommendation:
 * - Michael Koch: "Jump to bookmark" feature for quick navigation
 *
 * States:
 * 1. Hidden (default): No stored position
 * 2. Visible: Floating FAB when position exists
 * 3. Hover: Shows "Jump to {X}%" tooltip
 * 4. Click: Smooth scroll to saved position
 */
export function JumpToPositionButton({
  articleId,
  storedProgress,
  isVisible,
  onJump,
}: JumpToPositionButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Hide button after jumping (provide visual feedback)
  const handleJump = () => {
    if (!isVisible) return;

    setIsAnimating(true);

    // Restore position from localStorage
    const STORAGE_KEY_PREFIX = 'reading_position_';
    const storageKey = `${STORAGE_KEY_PREFIX}${articleId}`;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const position = JSON.parse(stored);
        scrollToPosition(position.scrollY);
      }
    } catch (error) {
      console.warn('Failed to restore position:', error);
    }

    // Trigger callback
    onJump?.();

    // Hide button after animation
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  if (!isVisible || isAnimating) return null;

  return (
    <div className="relative">
      {/* Jump to Position Button */}
      <button
        onClick={handleJump}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="
          fixed bottom-24 right-8 z-50
          px-4 py-2
          bg-primary text-white
          rounded-full shadow-lg
          flex items-center gap-2
          hover:bg-primary/90
          transition-all duration-300
          hover:scale-105
          animate-fade-in
          font-medium text-sm
        "
        aria-label={`Jump to saved position (${storedProgress}%)`}
      >
        {/* Arrow Up Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>

        {/* Position Badge */}
        <span className="tabular-nums">{storedProgress}%</span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="
            fixed bottom-40 right-8
            px-3 py-1.5
            bg-gray-900/90 text-white
            text-xs rounded-lg
            whitespace-nowrap
            animate-fade-in
            z-50
          "
        >
          Jump to saved position
        </div>
      )}
    </div>
  );
}
