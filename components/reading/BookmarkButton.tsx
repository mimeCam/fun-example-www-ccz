'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BookmarkButtonProps {
  articleId: string;
  articleTitle: string;
}

/**
 * BookmarkButton - One-Click "Read Later" functionality
 *
 * Design Philosophy:
 * - Utility-first: Solves "I want to read this later"
 * - Zero friction: No login, no commitment
 * - Delightful micro-interactions
 * - Invisible storage: Uses browser localStorage
 *
 * States:
 * 1. Unsaved (default): Outline bookmark icon
 * 2. Hover: Tooltip appears "Save for later"
 * 3. Saved: Filled icon + accent color + subtle animation
 * 4. Reading from saved: Simple page shows saved articles
 */
export function BookmarkButton({ articleId, articleTitle }: BookmarkButtonProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showSavedTooltip, setShowSavedTooltip] = useState(false);

  // Check if article is already saved on mount
  useEffect(() => {
    const savedArticles = getSavedArticles();
    setIsSaved(savedArticles.includes(articleId));
  }, [articleId]);

  const getSavedArticles = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('saved-articles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveArticle = (articles: string[]) => {
    try {
      localStorage.setItem('saved-articles', JSON.stringify(articles));
    } catch (e) {
      console.error('Failed to save article:', e);
    }
  };

  const toggleBookmark = () => {
    const savedArticles = getSavedArticles();
    const newSavedArticles = isSaved
      ? savedArticles.filter(id => id !== articleId)
      : [...savedArticles, articleId];

    saveArticle(newSavedArticles);
    setIsSaved(!isSaved);

    // Show "Saved!" tooltip if saving
    if (!isSaved) {
      setShowSavedTooltip(true);
      setTimeout(() => setShowSavedTooltip(false), 2000);
    }
  };

  return (
    <div className="relative">
      {/* Bookmark Button */}
      <button
        onClick={toggleBookmark}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          relative p-2 rounded-full transition-all duration-300
          ${isSaved
            ? 'bg-primary/20 text-primary'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }
        `}
        aria-label={isSaved ? 'Remove from saved' : 'Save for later'}
      >
        {/* Bookmark Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={isSaved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isSaved ? 'animate-bounce-subtle' : ''}
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>

        {/* Checkmark animation when saved */}
        {isSaved && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs animate-fade-in">✓</span>
          </span>
        )}
      </button>

      {/* Tooltip: "Save for later" */}
      {!isSaved && showTooltip && (
        <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-gray-900/90 text-white text-xs rounded-lg whitespace-nowrap animate-fade-in z-50">
          Save for later
        </div>
      )}

      {/* Tooltip: "Saved! ✓" */}
      {showSavedTooltip && (
        <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-green-600/90 text-white text-xs rounded-lg whitespace-nowrap animate-fade-in z-50">
          Saved! ✓
        </div>
      )}
    </div>
  );
}

// Add custom animations to Tailwind config or use inline styles
// For now, these would need to be added to tailwind.config.ts:
// animate-bounce-subtle: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-2px)' } }
// animate-fade-in: { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } }
