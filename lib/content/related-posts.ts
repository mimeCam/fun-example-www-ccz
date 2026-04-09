/**
 * Related Posts Business Logic
 * Merges editor picks with algorithmic recommendations
 */

import { Article, RelatedArticle } from './ContentTagger';
import { findRelatedArticles } from './ContentTagger';
import { getEditorPicks, EditorPick } from '../db/editor-picks';
import { getArticleById, getAllArticles } from './articleData';

export interface RelatedPostWithSource {
  article: Article;
  source: 'editor' | 'algorithmic';
  reason?: string;
  similarityScore?: number;
}

/**
 * Get related posts combining editor picks and algorithmic recommendations
 * @param articleId - The current article ID
 * @param maxResults - Maximum number of results (default 3)
 * @returns Array of related posts with source indication
 */
export function getRelatedPosts(
  articleId: string,
  maxResults: number = 3
): RelatedPostWithSource[] {
  const currentArticle = getArticleById(articleId);
  if (!currentArticle) {
    return [];
  }

  // Get editor picks (priority 1)
  const editorPicks = getEditorPicks(articleId);

  // Convert editor picks to related posts
  const editorPosts: RelatedPostWithSource[] = editorPicks
    .filter(pick => {
      // Verify target article exists
      const targetArticle = getArticleById(pick.target_article_id);
      return targetArticle !== undefined;
    })
    .map(pick => {
      const targetArticle = getArticleById(pick.target_article_id)!;
      return {
        article: targetArticle,
        source: 'editor' as const,
        reason: pick.reason,
      };
    });

  // Get algorithmic recommendations (priority 2 - fill remaining slots)
  const needed = maxResults - editorPosts.length;
  let algorithmicPosts: RelatedPostWithSource[] = [];

  if (needed > 0) {
    const allArticles = getAllArticles();
    const algorithmicResults = findRelatedArticles(currentArticle, allArticles, needed * 2); // Get extra for deduplication

    // Filter out articles already in editor picks
    const editorPickIds = new Set(editorPicks.map(p => p.target_article_id));
    algorithmicPosts = algorithmicResults
      .filter(r => !editorPickIds.has(r.article.id))
      .slice(0, needed)
      .map(r => ({
        article: r.article,
        source: 'algorithmic' as const,
        similarityScore: r.similarityScore,
      }));
  }

  // Merge: editor picks first, then algorithmic
  return [...editorPosts, ...algorithmicPosts];
}

/**
 * Get all articles that have editor picks configured
 * Useful for admin interface
 */
export function getArticlesWithEditorPicks(): string[] {
  const allPicks = getEditorPicks('*');
  return [];
}
