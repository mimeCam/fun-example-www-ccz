/**
 * ArticleMeta Component - Displays article metadata with reading time
 *
 * This component displays article metadata such as author, date, and reading time.
 * It supports custom reading time messages and falls back to auto-calculated times.
 *
 * Design principles:
 * - Right-aligned reading time (creates visual balance)
 * - Subtle, secondary element (doesn't compete with title)
 * - Lower contrast for metadata
 * - Minimal text, no emoji (to avoid visual clutter)
 *
 */

import React from 'react';

/**
 * Props for ArticleMeta component
 */
export interface ArticleMetaProps {
  /** Author name */
  author?: string;

  /** Publication date */
  publishedAt?: Date | string;

  /** Reading time display text (e.g., "5 min read" or custom message) */
  readingTime?: string;

  /** Whether the reading time is custom (affects styling) */
  isCustomReadingTime?: boolean;

  /** Challenge count */
  challengeCount?: number;

  /** Additional CSS classes */
  className?: string;

  /** Whether to show the reading time prominently */
  emphasizeReadingTime?: boolean;
}

/**
 * Format date for display
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  // Format: "April 4, 2026"
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * ArticleMeta Component
 *
 * Displays article metadata in a clean, minimal format.
 * Reading time is right-aligned and can be emphasized if needed.
 *
 * @example
 * // Basic usage
 * <ArticleMeta
 *   author="Author Name"
 *   publishedAt="2026-04-04"
 *   readingTime="5 min read"
 * />
 *
 * @example
 * // With custom reading time
 * <ArticleMeta
 *   author="Author Name"
 *   publishedAt="2026-04-04"
 *   readingTime="8 min to transform your workflow ⚡"
 *   isCustomReadingTime={true}
 *   emphasizeReadingTime={true}
 * />
 */
export function ArticleMeta({
  author,
  publishedAt,
  readingTime,
  isCustomReadingTime = false,
  challengeCount = 0,
  className = '',
  emphasizeReadingTime = false,
}: ArticleMetaProps) {
  return (
    <div className={`flex items-center gap-4 text-sm ${className}`}>
      {/* Author and date - always visible */}
      <span className="text-gray-400">
        {author && <span>By {author}</span>}
        {author && publishedAt && ' • '}
        {publishedAt && <span>{formatDate(publishedAt)}</span>}
      </span>

      {/* Challenge count - if any */}
      {challengeCount > 0 && (
        <span className="text-gray-400">
          • {challengeCount} challenge{challengeCount > 1 ? 's' : ''}
        </span>
      )}

      {/* Reading time - emphasized if custom */}
      {readingTime && (
        <span
          className={
            emphasizeReadingTime || isCustomReadingTime
              ? 'text-primary font-medium'
              : 'text-gray-400'
          }
        >
          {' • '}
          {readingTime}
        </span>
      )}
    </div>
  );
}

/**
 * Standalone ReadingTimeDisplay component
 *
 * For cases where you only need to display reading time without other metadata.
 * Useful for cards, lists, and other compact displays.
 *
 */
export interface ReadingTimeDisplayProps {
  /** Reading time display text */
  readingTime: string;

  /** Whether this is a custom message (affects styling) */
  isCustom?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Position alignment */
  align?: 'left' | 'center' | 'right';
}

export function ReadingTimeDisplay({
  readingTime,
  isCustom = false,
  className = '',
  align = 'left',
}: ReadingTimeDisplayProps) {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <span
      className={`
        text-sm
        ${isCustom ? 'text-primary font-medium' : 'text-gray-400'}
        ${alignmentClasses[align]}
        ${className}
      `}
    >
      {readingTime}
    </span>
  );
}
