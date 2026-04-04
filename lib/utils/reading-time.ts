/**
 * Reading Time Calculator - Shared utility for content time estimation
 *
 * Provides simple, reusable functions to calculate reading time from text content.
 * This creates foundation for time-based features (pacing, scheduling, progress).
 *
 * Based on average reading speed of 200-250 words per minute.
 * // TODO: Add support for markdown content
 * // TODO: Add configurable reading speed (for different languages/audiences)
 * // TODO: Add image/media time consideration
 */

/**
 * Strip HTML tags from content for word counting
 *
 * @param html - HTML content string
 * @returns Plain text without HTML tags
 *
 * // TODO: Handle SVG and other edge cases
 * // TODO: Preserve meaningful whitespace
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Count words in a text string
 *
 * @param text - Plain text content
 * @returns Number of words in the text
 *
 * // TODO: Better handling of non-Latin scripts (CJK, etc.)
 * // TODO: Handle hyphenated words intelligently
 */
export function countWords(text: string): number {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Calculate estimated reading time in minutes
 *
 * @param content - Text or HTML content
 * @param wordsPerMinute - Reading speed (default: 225 WPM)
 * @returns Estimated reading time in minutes (rounded up)
 *
 * // TODO: Add confidence interval based on content complexity
 * // TODO: Consider image/figure count in estimation
 */
export function calculateReadingTime(
  content: string,
  wordsPerMinute: number = 225
): number {
  const plainText = content.includes('<') ? stripHtml(content) : content;
  const wordCount = countWords(plainText);

  if (wordCount === 0) return 0;

  // Round up to nearest minute, minimum 1 minute for any content
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * Format reading time for display
 *
 * @param minutes - Reading time in minutes
 * @returns Human-readable string (e.g., "5 min read", "15 min read")
 *
 * // TODO: Add localization support
 * // TODO: Show seconds for very short content (< 1 min)
 */
export function formatReadingTime(minutes: number): string {
  if (minutes === 0) return 'No content';
  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
}

/**
 * Get complete reading time stats from content
 *
 * @param content - Text or HTML content
 * @param wordsPerMinute - Reading speed (default: 225 WPM)
 * @returns Object with word count, minutes, and formatted string
 *
 * // TODO: Add character count for social media sharing
 * // TODO: Add estimated completion time based on current progress
 */
export function getReadingStats(
  content: string,
  wordsPerMinute: number = 225
): {
  wordCount: number;
  minutes: number;
  formatted: string;
} {
  const plainText = content.includes('<') ? stripHtml(content) : content;
  const wordCount = countWords(plainText);
  const minutes = calculateReadingTime(content, wordsPerMinute);
  const formatted = formatReadingTime(minutes);

  return { wordCount, minutes, formatted };
}
