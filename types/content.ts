/**
 * Content Depth Types - Progressive content revelation data structures
 *
 * These types define the shape of articles with unlockable bonus content.
 * Depth layers reveal additional insights based on reader engagement time.
 *
 * Stratified Content: archetype-based content visibility layering.
 * The same URL shows different paragraphs depending on reader identity.
 */

import type { Session } from '@/lib/session/SessionManager';

// ─── Stratified Content Types ────────────────────────────────

/** The 5 Mirror archetypes that drive content layer visibility */
export type ArchetypeKey =
  | 'deep-diver'
  | 'explorer'
  | 'faithful'
  | 'resonator'
  | 'collector';

/** Layered article content — replaces flat `content: string` */
export interface LayeredArticleContent {
  core: string;         // Always visible — must be a complete, satisfying article
  paragraphVariants?: ParagraphVariantMap; // Per-slot archetype overrides for core paragraphs
  marginalia?: string;  // Returning readers — side-notes, "since you were here" callouts
  extensions: Partial<Record<ArchetypeKey, string>>; // Archetype-gated bonus paragraphs
}

/** Per-paragraph archetype variants. Keyed by paragraph slot index. */
export interface ParagraphVariantMap {
  [slotIndex: number]: Partial<Record<ArchetypeKey, string>>;
}

/** A single paragraph resolved for a specific reader's archetype */
export interface ResolvedParagraph {
  slotIndex: number;
  text: string;
  /** Which variant was picked: null = default, ArchetypeKey = variant */
  source: ArchetypeKey | null;
}

/** Which layers a reader is allowed to see */
export type VisibleLayer = 'core' | 'marginalia' | 'resonance-marginalia' | ArchetypeKey;

// ─── Paragraph Engagement Types ────────────────────────────

/** Per-paragraph engagement data from IntersectionObserver tracking */
export interface ParagraphEngagement {
  paragraphId: string;
  dwellMs: number;     // total ms spent in this paragraph
  visits: number;      // number of times reader entered
  isDeepRead: boolean; // dwell exceeds deep-read threshold
  skipped: boolean;    // paragraph was never entered or dwell < skip threshold
}

/** Map from paragraph ID to engagement data */
export type ParagraphEngagementMap = Record<string, ParagraphEngagement>;

/** Derived summary of paragraph engagement — fed into scoring engine */
export interface ParagraphEngagementSummary {
  deepReadRatio: number;      // 0-1: fraction of visited paragraphs with deep reads
  engagementVariance: number; // 0-1: normalized variance of dwell times
  peakParagraphCount: number; // paragraphs with dwell > 2× average
  skipRatio: number;          // 0-1: fraction of paragraphs skipped
}

// ─── Time-Based Depth Types (existing) ───────────────────────

/**
 * A depth layer represents bonus content that unlocks after a threshold
 */
export interface ContentLayer {
  id: string;
  articleId: string;
  thresholdMinutes: number;
  title: string;
  description?: string; // Brief description of what's inside
  content: string; // HTML or markdown content
  unlocked: boolean;
  unlockedAt?: number; // Timestamp when unlocked
}

/**
 * Extended article type with progressive content support
 */
export interface ArticleWithDepth {
  id: string;
  slug: string;
  title: string;
  publishedAt: Date;
  estimatedReadTime: number; // minutes
  depthLayers: ContentLayer[];
  metadata: {
    author: string;
    postType: 'technical' | 'design' | 'personal' | 'business' | 'general';
  };
}

/**
 * Result of checking unlock status for all layers
 */
export interface UnlockCheckResult {
  session: Session;
  layers: ContentLayer[];
  newlyUnlocked: string[]; // Layer IDs that just unlocked
  nextUnlockIn?: number; // Milliseconds until next threshold
}

/**
 * Engagement analytics for article performance
 */
export interface LayerEngagement {
  articleId: string;
  layerId: string;
  thresholdMinutes: number;
  unlockCount: number; // How many sessions unlocked this layer
  avgTimeToUnlock: number; // Average milliseconds to reach threshold
  totalSessions: number; // Total sessions that viewed article
}

/**
 * Session data for persistence
 */
export interface SessionData {
  sessionId: string;
  articleId: string;
  startTime: number;
  endTime?: number;
  duration: number; // milliseconds
  unlocks: string[];
  deviceType?: 'mobile' | 'tablet' | 'desktop';
}
