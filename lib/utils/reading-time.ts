/**
 * Reading Time Calculator - Shared utility for content time estimation
 *
 * Provides simple, reusable functions to calculate reading time from text content.
 * This creates foundation for time-based features (pacing, scheduling, progress).
 *
 * Based on average reading speed of 200-250 words per minute for prose.
 * Code blocks are weighted 3x since they require careful reading and analysis.
 *
 * Features:
 * - Auto-calculate reading time from content
 * - Support custom reading time messages
 * - Format display for UI components
 * - Code block detection and weighting (3x multiplier)
 * - Markdown-aware parsing
 *
 */

/**
 * Strip HTML tags from content for word counting
 *
 * @param html - HTML content string
 * @returns Plain text without HTML tags
 *
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Code block information for weighted reading time calculation
 */
export interface CodeBlockInfo {
  /** Raw code block content */
  content: string;
  /** Word count in this code block */
  wordCount: number;
  /** Line count */
  lineCount: number;
}

/**
 * Extract code blocks from markdown content
 *
 * Detects code blocks in markdown format (triple backticks) and removes them
 * from the content for separate processing.
 *
 * @param content - Markdown content string
 * @returns Object with code blocks array and content without code blocks
 *
 * @example
 * parseCodeBlocks("Some text ```code here``` more text")
 * // => { codeBlocks: [{ content: "code here", wordCount: 2, lineCount: 1 }], content: "Some text  more text" }
 *
 */
export function parseCodeBlocks(content: string): {
  codeBlocks: CodeBlockInfo[];
  contentWithoutCodeBlocks: string;
} {
  const codeBlockRegex = /```[\s\S]*?```/g;
  const codeBlocks: CodeBlockInfo[] = [];
  let match: RegExpExecArray | null;

  // Find all code blocks
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const codeContent = match[0].replace(/^```\w*\n?/g, '').replace(/```$/g, '');
    const lines = codeContent.split('\n').filter(line => line.trim().length > 0);
    const wordCount = countWords(codeContent);

    codeBlocks.push({
      content: codeContent,
      wordCount,
      lineCount: lines.length,
    });
  }

  // Remove code blocks from content for prose word counting
  const contentWithoutCodeBlocks = content.replace(codeBlockRegex, ' ');

  return {
    codeBlocks,
    contentWithoutCodeBlocks,
  };
}

/**
 * Count words in a text string
 *
 * @param text - Plain text content
 * @returns Number of words in the text
 *
 */
export function countWords(text: string): number {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Count weighted words with code block consideration
 *
 * Code blocks take longer to read and understand than prose, so we weight them
 * higher in the reading time calculation. Research suggests code comprehension
 * is 3-5x slower than prose reading.
 *
 * @param content - Markdown content (may include code blocks)
 * @param codeBlockWeight - Multiplier for code block words (default: 3x)
 * @returns Weighted word count for reading time calculation
 *
 * @example
 * countWeightedWords("Hello world ```console.log('test')```", 3)
 * // => 2 + 3 = 5 (2 prose words + 3x weighted code word)
 *
 */
export function countWeightedWords(
  content: string,
  codeBlockWeight: number = 3
): {
  weightedWordCount: number;
  proseWordCount: number;
  codeWordCount: number;
  codeBlockCount: number;
} {
  // Parse out code blocks
  const { codeBlocks, contentWithoutCodeBlocks } = parseCodeBlocks(content);

  // Count prose words (content without code blocks)
  const proseWordCount = countWords(contentWithoutCodeBlocks);

  // Count code block words (will be weighted)
  const codeWordCount = codeBlocks.reduce((sum, block) => sum + block.wordCount, 0);

  // Calculate weighted total
  const weightedWordCount = proseWordCount + (codeWordCount * codeBlockWeight);

  return {
    weightedWordCount,
    proseWordCount,
    codeWordCount,
    codeBlockCount: codeBlocks.length,
  };
}

/**
 * Calculate estimated reading time in minutes
 *
 * Uses weighted word counting that accounts for code blocks (3x slower to read).
 * Provides more accurate estimates for technical content.
 *
 * @param content - Text or HTML content (markdown supported)
 * @param wordsPerMinute - Reading speed for prose (default: 225 WPM)
 * @param codeBlockWeight - Multiplier for code blocks (default: 3x)
 * @returns Estimated reading time in minutes (rounded up)
 *
 * @example
 * calculateReadingTime("Hello world ```code```") // ~1 min
 * calculateReadingTime(longProseArticle) // ~5-10 min
 * calculateReadingTime(heavyCodeTutorial) // ~15-20 min (code weighted 3x)
 *
 */
export function calculateReadingTime(
  content: string,
  wordsPerMinute: number = 225,
  codeBlockWeight: number = 3
): number {
  // If content has HTML tags, strip them first
  const plainText = content.includes('<') ? stripHtml(content) : content;

  // Use weighted word counting for markdown content
  const { weightedWordCount } = countWeightedWords(plainText, codeBlockWeight);

  if (weightedWordCount === 0) return 0;

  // Round up to nearest minute, minimum 1 minute for any content
  return Math.max(1, Math.ceil(weightedWordCount / wordsPerMinute));
}

/**
 * Format reading time for display
 *
 * @param minutes - Reading time in minutes
 * @returns Human-readable string (e.g., "5 min read", "15 min read")
 *
 */
export function formatReadingTime(minutes: number): string {
  if (minutes === 0) return 'No content';
  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
}

/**
 * Get complete reading time stats from content
 *
 * Provides detailed statistics including weighted word counts and breakdown
 * of prose vs code content.
 *
 * @param content - Text or HTML content (markdown supported)
 * @param wordsPerMinute - Reading speed for prose (default: 225 WPM)
 * @param codeBlockWeight - Multiplier for code blocks (default: 3x)
 * @returns Object with word counts, minutes, formatted string, and breakdown
 *
 * @example
 * getReadingStats(articleContent)
 * // => {
 * //      wordCount: 1000,
 * //      weightedWordCount: 1500,
 * //      proseWordCount: 800,
 * //      codeWordCount: 200,
 * //      codeBlockCount: 5,
 * //      minutes: 7,
 * //      formatted: "7 min read"
 * //    }
 *
 */
export function getReadingStats(
  content: string,
  wordsPerMinute: number = 225,
  codeBlockWeight: number = 3
): {
  wordCount: number; // Total actual words (unweighted)
  weightedWordCount: number; // Weighted for code blocks
  proseWordCount: number; // Non-code words
  codeWordCount: number; // Code block words
  codeBlockCount: number; // Number of code blocks
  minutes: number;
  formatted: string;
} {
  const plainText = content.includes('<') ? stripHtml(content) : content;

  // Get detailed word count breakdown
  const wordStats = countWeightedWords(plainText, codeBlockWeight);

  // Calculate reading time
  const minutes = calculateReadingTime(plainText, wordsPerMinute, codeBlockWeight);
  const formatted = formatReadingTime(minutes);

  return {
    wordCount: wordStats.proseWordCount + wordStats.codeWordCount, // Total actual words
    weightedWordCount: wordStats.weightedWordCount,
    proseWordCount: wordStats.proseWordCount,
    codeWordCount: wordStats.codeWordCount,
    codeBlockCount: wordStats.codeBlockCount,
    minutes,
    formatted,
  };
}

/**
 * Get reading time display with custom message support
 *
 * This function provides the complete reading time display logic:
 * - Uses custom message if provided
 * - Falls back to auto-calculated reading time if not
 * - Returns both the display text and the calculated minutes
 *
 * @param content - Text or HTML content (markdown supported)
 * @param customReadingTime - Optional custom reading time message
 * @param wordsPerMinute - Reading speed for auto-calculation (default: 225 WPM)
 * @param codeBlockWeight - Multiplier for code blocks (default: 3x)
 * @returns Object with display text, minutes, and whether it's custom
 *
 * @example
 * // With custom message
 * getReadingTimeDisplay(content, "8 min to transform your workflow ⚡")
 * // => { display: "8 min to transform your workflow ⚡", minutes: 8, isCustom: true }
 *
 * @example
 * // Without custom message (auto-calculated with code block weighting)
 * getReadingTimeDisplay(markdownContentWithCode)
 * // => { display: "7 min read", minutes: 7, isCustom: false }
 *
 */
export function getReadingTimeDisplay(
  content: string,
  customReadingTime?: string,
  wordsPerMinute: number = 225,
  codeBlockWeight: number = 3
): {
  display: string;
  minutes: number;
  isCustom: boolean;
} {
  // If custom reading time is provided, use it
  if (customReadingTime && customReadingTime.trim().length > 0) {
    // Try to extract minutes from custom message for tracking
    const minutesMatch = customReadingTime.match(/(\d+)\s*(min|minute)/i);
    const customMinutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

    return {
      display: customReadingTime.trim(),
      minutes: customMinutes > 0 ? customMinutes : calculateReadingTime(content, wordsPerMinute, codeBlockWeight),
      isCustom: true,
    };
  }

  // Otherwise, auto-calculate reading time with code block weighting
  const minutes = calculateReadingTime(content, wordsPerMinute, codeBlockWeight);
  const display = formatReadingTime(minutes);

  return {
    display,
    minutes,
    isCustom: false,
  };
}

/**
 * Calculate reading time at build time for caching
 *
 * This function is designed to be called during the build process to pre-calculate
 * reading times for all posts, improving performance at runtime.
 *
 * @param content - Text or HTML content (markdown supported)
 * @param customReadingTime - Optional custom reading time message
 * @param wordsPerMinute - Reading speed for auto-calculation (default: 225 WPM)
 * @param codeBlockWeight - Multiplier for code blocks (default: 3x)
 * @returns Object with all reading time data for caching
 *
 * @example
 * calculateReadingTimeForCache(markdownContent)
 * // => {
 * //      display: "7 min read",
 * //      minutes: 7,
 * //      isCustom: false,
 * //      wordCount: 1000,
 * //      weightedWordCount: 1500,
 * //      proseWordCount: 800,
 * //      codeWordCount: 200,
 * //      codeBlockCount: 5,
 * //      calculatedAt: 1712345678901
 * //    }
 *
 */
export function calculateReadingTimeForCache(
  content: string,
  customReadingTime?: string,
  wordsPerMinute: number = 225,
  codeBlockWeight: number = 3
): {
  display: string;
  minutes: number;
  isCustom: boolean;
  wordCount: number;
  weightedWordCount: number;
  proseWordCount: number;
  codeWordCount: number;
  codeBlockCount: number;
  calculatedAt: number; // timestamp
} {
  const plainText = content.includes('<') ? stripHtml(content) : content;

  // Get detailed word count breakdown
  const wordStats = countWeightedWords(plainText, codeBlockWeight);

  // Get reading time display
  const timeData = getReadingTimeDisplay(content, customReadingTime, wordsPerMinute, codeBlockWeight);

  return {
    ...timeData,
    wordCount: wordStats.proseWordCount + wordStats.codeWordCount,
    weightedWordCount: wordStats.weightedWordCount,
    proseWordCount: wordStats.proseWordCount,
    codeWordCount: wordStats.codeWordCount,
    codeBlockCount: wordStats.codeBlockCount,
    calculatedAt: Date.now(),
  };
}
