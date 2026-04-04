/**
 * Journey Context Engine - Calculate article metadata from content
 *
 * Pure functions for analyzing content and extracting journey context.
 * Follows Sid's philosophy: functions under 10 lines, testable and simple.
 */

import type { JourneyContext, DepthLevel, ContentDNATag, OutcomePromise } from '@/types/journey-context';
import { extractKeywords } from './ContentTagger';

/**
 * Calculate depth level based on content complexity
 *
 * Uses word count, sentence complexity, and concept density.
 * Light: <300 words, simple sentences
 * Medium: 300-800 words, some complex sentences
 * Deep: 800-1500 words, complex concepts
 * Profound: >1500 words, builds on concepts
 */
export function calculateDepth(content: string): DepthLevel {
  const words = content.split(/\s+/).length;
  const sentences = content.split(/[.!?]+/).length;
  const avgWordsPerSentence = words / sentences;

  if (words < 300) return 'light';
  if (words < 800) return 'medium';
  if (words < 1500) return 'deep';
  return 'profound';
}

/**
 * Convert depth level to visual indicator (circles)
 *
 * Light: ○ (1 circle)
 * Medium: ○○ (2 circles)
 * Deep: ○○○ (3 circles)
 * Profound: ○○○○ (4 circles)
 */
export function depthToIndicator(depth: DepthLevel): string {
  const indicators: Record<DepthLevel, string> = {
    light: '○',
    medium: '○○',
    deep: '○○○',
    profound: '○○○○',
  };
  return indicators[depth];
}

/**
 * Extract content DNA tags from article
 *
 * Uses keyword extraction but filters for meaningful topics.
 * Returns top 3 most relevant tags.
 */
export function extractContentDNA(content: string): ContentDNATag[] {
  const keywords = extractKeywords(content);

  // Filter for meaningful topic words (not just frequent words)
  const topicWords = keywords.filter(word =>
    word.length > 4 && !['about', 'which', 'their', 'there'].includes(word)
  );

  return topicWords.slice(0, 3);
}

/**
 * Generate outcome promise from content
 *
 * Analyzes first paragraph for value proposition.
 * // TODO: Use ML to extract actual outcomes
 * // TODO: Generate different outcomes for different audiences
 */
export function generateOutcome(content: string): OutcomePromise {
  const sentences = content.split(/[.!?]+/);

  if (sentences.length === 0) {
    return 'Insights and perspectives on this topic';
  }

  // Use first meaningful sentence as outcome
  const firstSentence = sentences[0].trim();

  if (firstSentence.length < 50) {
    return firstSentence;
  }

  // Truncate long sentences
  return firstSentence.substring(0, 80) + '...';
}

/**
 * Calculate full journey context from article content
 *
 * Combines all analysis functions into complete context.
 * // TODO: Add caching for performance
 * // TODO: Allow manual overrides from frontmatter
 */
export function calculateJourneyContext(content: string): JourneyContext {
  return {
    depth: calculateDepth(content),
    dnaTags: extractContentDNA(content),
    outcome: generateOutcome(content),
  };
}

/**
 * Get journey context with minimal display format
 *
 * Returns only depth indicator and single tag for cards.
 * // TODO: Add options for custom minimal formats
 */
export function getMinimalContext(context: JourneyContext): {
  depthIndicator: string;
  primaryTag: string;
} {
  return {
    depthIndicator: depthToIndicator(context.depth),
    primaryTag: context.dnaTags[0] || 'general',
  };
}
