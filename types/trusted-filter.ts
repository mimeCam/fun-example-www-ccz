/**
 * Trusted Filter types
 *
 * This implements the "Trusted Filter" feature that positions the author as a curator
 * by providing contextual information and related perspectives on article topics.
 */

export type PerspectiveType = 'complementary' | 'contrarian' | 'foundational';

/**
 * A single perspective link with description
 */
export interface PerspectiveLink {
  url: string;
  title: string;
  description: string; // 1-2 sentences
  author?: string; // Optional attribution
  type?: PerspectiveType;
}

/**
 * Filter context that helps readers understand if this article is for them
 */
export interface FilterContext {
  targetAudience: string; // "Who this is for" - e.g., "Developers interested in system design"
  valuePromise: string; // "What you'll get" - e.g., "A practical framework for building scalable systems"
  timeCommitment?: string; // Optional: "8 min read"
}

/**
 * Complete trusted filter data for an article
 */
export interface TrustedFilterData {
  context: FilterContext;
  perspectives: PerspectiveLink[]; // Max 3 items recommended
}

/**
 * Perspective type configuration for UI rendering
 */
export const PERSPECTIVE_TYPE_CONFIG: Record<PerspectiveType, { label: string; color: string }> = {
  complementary: {
    label: 'Expands on this topic',
    color: 'text-blue-400',
  },
  contrarian: {
    label: 'Different viewpoint',
    color: 'text-orange-400',
  },
  foundational: {
    label: 'Background reading',
    color: 'text-green-400',
  },
};
