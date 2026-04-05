/**
 * Curiosity Trail Utility Functions
 * Pure functions for trail validation and navigation
 * Following Sid's philosophy: functions under 10 lines, testable and simple
 */

import type {
  Trail,
  TrailConnection,
  TrailWithArticles,
  TrailNavigation
} from '../../types/trail';
import type { Article } from './ContentTagger';

/**
 * Validate trail structure and connections
 */
export function validateTrail(trail: Trail): boolean {
  // Check if all articles in trail exist in connections
  const articleIds = new Set(trail.articleIds);

  // Validate all connections reference valid articles
  const validConnections = trail.connections.every(
    conn => articleIds.has(conn.fromArticleId) && articleIds.has(conn.toArticleId)
  );

  // Must have at least 2 articles to form a trail
  const hasEnoughArticles = trail.articleIds.length >= 2;

  return validConnections && hasEnoughArticles;
}

/**
 * Get next article in trail
 */
export function getNextArticle(trail: Trail, currentArticleId: string): string | null {
  const currentIndex = trail.articleIds.indexOf(currentArticleId);

  if (currentIndex === -1 || currentIndex === trail.articleIds.length - 1) {
    return null;
  }

  return trail.articleIds[currentIndex + 1];
}

/**
 * Get previous article in trail
 */
export function getPreviousArticle(trail: Trail, currentArticleId: string): string | null {
  const currentIndex = trail.articleIds.indexOf(currentArticleId);

  if (currentIndex <= 0) {
    return null;
  }

  return trail.articleIds[currentIndex - 1];
}

/**
 * Find connection between two articles
 */
export function getConnectionBetween(
  trail: Trail,
  fromArticleId: string,
  toArticleId: string
): TrailConnection | null {
  return trail.connections.find(
    conn => conn.fromArticleId === fromArticleId && conn.toArticleId === toArticleId
  ) || null;
}

/**
 * Calculate trail progress percentage
 */
export function calculateProgress(
  trail: Trail,
  completedArticles: Set<string>
): number {
  if (trail.articleIds.length === 0) return 0;

  const completed = trail.articleIds.filter(id => completedArticles.has(id)).length;
  return Math.round((completed / trail.articleIds.length) * 100);
}

/**
 * Check if article is start of trail
 */
export function isTrailStart(trail: Trail, articleId: string): boolean {
  return trail.articleIds[0] === articleId;
}

/**
 * Check if article is end of trail
 */
export function isTrailEnd(trail: Trail, articleId: string): boolean {
  return trail.articleIds[trail.articleIds.length - 1] === articleId;
}

/**
 * Create trail navigation state
 */
export function createTrailNavigation(
  trailWithArticles: TrailWithArticles,
  currentIndex: number
): TrailNavigation {
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < trailWithArticles.articleIds.length - 1;

  const completedCount = currentIndex; // Simplified: assume articles before current are completed
  const progress = Math.round((completedCount / trailWithArticles.articleIds.length) * 100);

  return {
    trail: trailWithArticles,
    currentIndex,
    canGoBack,
    canGoForward,
    progress
  };
}

/**
 * Populate trail with full article data
 */
export function populateTrailArticles(
  trail: Trail,
  getArticle: (id: string) => Article | null
): TrailWithArticles | null {
  const articles = trail.articleIds
    .map(id => getArticle(id))
    .filter((article): article is Article => article !== null);

  if (articles.length !== trail.articleIds.length) {
    return null; // Some articles not found
  }

  return {
    ...trail,
    articles
  };
}

/**
 * Estimate trail reading time (sum of all articles)
 */
export function estimateTrailTime(
  trail: Trail,
  articles: Article[]
): string {
  const totalWords = articles.reduce((sum, article) => {
    const wordCount = article.content.split(/\s+/).length;
    return sum + wordCount;
  }, 0);

  const minutes = Math.ceil(totalWords / 200); // 200 words per minute

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}
