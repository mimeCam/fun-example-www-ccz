/**
 * Curiosity Trail Component
 * Displays author-curated semantic trails for content discovery
 * Reader layer: Visualizes trails and provides navigation
 */

'use client';

import React, { useState, useEffect } from 'react';
import type {
  Trail,
  TrailNavigation,
  TrailConnection
} from '../types/trail';

interface CuriosityTrailProps {
  /** Current article ID */
  currentArticleId: string;

  /** Trail data (optional, fetched if not provided) */
  trail?: Trail;

  /** On navigation callback */
  onNavigate?: (articleId: string) => void;
}

/**
 * Curiosity Trail: Show related articles in a curated path
 */
export function CuriosityTrail({
  currentArticleId,
  trail: initialTrail,
  onNavigate
}: CuriosityTrailProps) {
  const [trail, setTrail] = useState<Trail | null>(initialTrail || null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(!initialTrail);

  // Fetch trail data if not provided
  useEffect(() => {
    if (!initialTrail) {
      // TODO: Fetch trail data from API
      // For now, this is a placeholder
      setIsLoading(false);
    }
  }, [initialTrail]);

  // Find current position in trail
  useEffect(() => {
    if (trail && currentArticleId) {
      const index = trail.articleIds.indexOf(currentArticleId);
      setCurrentIndex(index);
    }
  }, [trail, currentArticleId]);

  if (isLoading) {
    return <div className="animate-pulse">Loading trail...</div>;
  }

  if (!trail || currentIndex === -1) {
    return null; // No trail available for this article
  }

  const connection = getNextConnection(trail, currentIndex);
  if (!connection) {
    return null; // End of trail
  }

  return (
    <div className="curiosity-trail mt-8 p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
      <div className="flex items-start gap-4">
        {/* Trail icon */}
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
          {currentIndex + 1}
        </div>

        <div className="flex-1">
          {/* Trail header */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Continue Your Journey
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({currentIndex + 1} of {trail.articleIds.length})
            </span>
          </div>

          {/* Connection reasoning */}
          <ConnectionReasoning connection={connection} />

          {/* Next article navigation */}
          <NextArticleNavigation
            trail={trail}
            currentIndex={currentIndex}
            onNavigate={onNavigate}
          />

          {/* Progress bar */}
          <ProgressBar current={currentIndex + 1} total={trail.articleIds.length} />
        </div>
      </div>
    </div>
  );
}

/**
 * Display connection reasoning
 */
function ConnectionReasoning({ connection }: { connection: TrailConnection }) {
  return (
    <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-md border-l-4 border-purple-500">
      <p className="text-sm text-gray-700 dark:text-gray-300 italic">
        "{connection.reason}"
      </p>
      <ConnectionTypeBadge type={connection.connectionType} />
    </div>
  );
}

/**
 * Display connection type badge
 */
function ConnectionTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    foundational: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    extension: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    practical: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    alternative: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    related: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  };

  const labels: Record<string, string> = {
    foundational: 'Foundation',
    extension: 'Deep Dive',
    practical: 'Application',
    alternative: 'Perspective',
    related: 'Related'
  };

  return (
    <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${colors[type] || colors.related}`}>
      {labels[type] || 'Related'}
    </span>
  );
}

/**
 * Navigation to next article
 */
function NextArticleNavigation({
  trail,
  currentIndex,
  onNavigate
}: {
  trail: Trail;
  currentIndex: number;
  onNavigate?: (articleId: string) => void;
}) {
  const nextArticleId = trail.articleIds[currentIndex + 1];

  const handleClick = () => {
    if (onNavigate && nextArticleId) {
      onNavigate(nextArticleId);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full mt-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group"
    >
      <span>Next Article in Trail</span>
      <svg
        className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </button>
  );
}

/**
 * Progress bar
 */
function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
        <span>Progress</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Helper: Get next connection from current position
 */
function getNextConnection(trail: Trail, currentIndex: number): TrailConnection | null {
  if (currentIndex >= trail.articleIds.length - 1) {
    return null; // At the end of trail
  }

  const fromArticleId = trail.articleIds[currentIndex];
  const toArticleId = trail.articleIds[currentIndex + 1];

  return trail.connections.find(
    conn => conn.fromArticleId === fromArticleId && conn.toArticleId === toArticleId
  ) || null;
}
