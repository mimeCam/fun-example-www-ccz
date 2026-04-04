/**
 * Post Schema - Type definitions for blog posts with reading time support
 *
 * This schema defines the structure of blog posts, including optional custom
 * reading time messages. When a custom reading time is not provided, it will
 * be auto-calculated from content.
 */

/**
 * Post metadata including optional custom reading time
 *
 * // TODO: Add more metadata fields (tags, category, featured image)
 * // TODO: Add SEO fields (meta description, og image)
 */
export interface PostMetadata {
  /** Post title */
  title: string;

  /** Publication date */
  publishedAt: Date;

  /** Author name */
  author: string;

  /** Optional custom reading time message (e.g., "8 min to transform your workflow ⚡") */
  customReadingTime?: string;

  /** Post type for newsletter targeting */
  postType?: 'technical' | 'design' | 'personal' | 'business' | 'general';

  /** Estimated read time in minutes (auto-calculated if not provided) */
  estimatedReadTime?: number;
}

/**
 * Complete blog post structure
 *
 * // TODO: Add content field (HTML or markdown)
 * // TODO: Add excerpt/summary field
 * // TODO: Add featured image URL
 */
export interface Post {
  /** Unique post identifier */
  id: string;

  /** URL slug */
  slug: string;

  /** Post metadata */
  metadata: PostMetadata;

  /** Post content (HTML or markdown) */
  content: string;

  /** Calculated or provided reading time in minutes */
  readingTimeMinutes: number;

  /** Formatted reading time for display */
  readingTimeDisplay: string;
}

/**
 * Reading time display options
 *
 * // TODO: Add more formatting options (verbose, compact, with emoji)
 */
export interface ReadingTimeDisplayOptions {
  /** Whether to show custom message if available */
  showCustom?: boolean;

  /** Default format when no custom time is set */
  defaultFormat?: 'short' | 'long' | 'minimal';

  /** Whether to include emoji/icons */
  includeEmoji?: boolean;
}

/**
 * Post with reading time already calculated
 *
 * This type represents a post that has been processed and has its
 * reading time calculated or custom message applied.
 */
export interface PostWithReadingTime extends Post {
  /** Whether this post uses a custom reading time message */
  hasCustomReadingTime: boolean;
}
