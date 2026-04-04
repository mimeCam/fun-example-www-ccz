'use client';

import { useEffect, useState } from 'react';

interface ContinueReadingBannerProps {
  articleId: string;
  onDismiss: () => void;
}

/**
 * Banner that appears when a user returns to an article they've started reading.
 * Shows the approximate position and offers to scroll there.
 */
export function ContinueReadingBanner({ articleId, onDismiss }: ContinueReadingBannerProps) {
  const [storedPosition, setStoredPosition] = useState<{ scrollY: number; progress: number } | null>(null);

  useEffect(() => {
    try {
      const key = `reading_position_${articleId}`;
      const stored = localStorage.getItem(key);

      if (stored) {
        const position = JSON.parse(stored);
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progressPercent = documentHeight > 0
          ? Math.min(100, Math.round((position.scrollY / documentHeight) * 100))
          : 0;

        setStoredPosition({
          scrollY: position.scrollY,
          progress: progressPercent,
        });
      }
    } catch (error) {
      console.warn('Failed to load stored position:', error);
    }
  }, [articleId]);

  if (!storedPosition) return null;

  const handleScrollToPosition = () => {
    window.scrollTo({
      top: storedPosition.scrollY,
      behavior: 'smooth',
    });
    onDismiss();
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
      <div className="bg-surface border border-border rounded-lg shadow-lg px-6 py-4 flex items-center gap-4 max-w-md">
        <div className="flex-1">
          <p className="text-sm font-medium text-primary mb-1">
            Continue reading?
          </p>
          <p className="text-xs text-gray-400">
            You left off at {storedPosition.progress}% complete
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleScrollToPosition}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-opacity-90 transition-opacity"
            aria-label="Scroll to saved position"
          >
            Continue
          </button>

          <button
            onClick={onDismiss}
            className="px-4 py-2 bg-transparent border border-border text-gray-300 text-sm font-medium rounded-lg hover:bg-surface transition-colors"
            aria-label="Dismiss reading position reminder"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
