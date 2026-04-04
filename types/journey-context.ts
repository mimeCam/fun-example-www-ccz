/**
 * Journey Context System - Article metadata for reader preview
 *
 * Provides ambient information about article depth, content DNA, and outcomes.
 * Designed as environmental cues - felt but not focused upon (Tanya's design principle).
 */

/**
 * Depth level - Mental energy required to engage with content
 *
 * Light: Quick reads, introductions, overviews
 * Medium: Some concentration required, introduces concepts
 * Deep: Requires focus, builds on previous knowledge
 * Profound: Demands full attention, may challenge assumptions
 */
export type DepthLevel = 'light' | 'medium' | 'deep' | 'profound';

/**
 * Content DNA tags - Describe the mood and topic of content
 *
 * Examples: technical, philosophical, practical, controversial, inspiring
 */
export type ContentDNATag = string;

/**
 * Outcome promise - What the reader will gain from reading
 *
 * Should be specific and actionable. Examples:
 * - "Practical framework for X"
 * - "New perspective on Y"
 * - "Step-by-step guide to Z"
 */
export type OutcomePromise = string;

/**
 * Journey context metadata for an article
 *
 * // TODO: Add manual override fields for authors to set context
 * // TODO: Add confidence scores for auto-calculated values
 */
export interface JourneyContext {
  /** Depth level of the content */
  depth: DepthLevel;

  /** Content DNA tags (max 3 for display) */
  dnaTags: ContentDNATag[];

  /** What the reader will learn */
  outcome: OutcomePromise;
}

/**
 * Journey context display options
 *
 * // TODO: Add compact mode for mobile
 * // TODO: Add tooltip behavior for icons
 */
export interface JourneyContextDisplayOptions {
  /** Whether to show full context or minimal */
  mode?: 'minimal' | 'full';

  /** Show DNA tags */
  showTags?: boolean;

  /** Show outcome promise */
  showOutcome?: boolean;
}
