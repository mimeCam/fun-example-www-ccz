/**
 * Server Actions for Related Posts
 * These run on the server and can safely access the database
 */

'use server';

import { getRelatedPosts } from '@/lib/content/related-posts';
import { RelatedPostWithSource } from '@/lib/content/related-posts';

/**
 * Get related posts for an article (server action)
 * @param articleId - The article ID
 * @returns Array of related posts
 */
export async function fetchRelatedPosts(
  articleId: string
): Promise<RelatedPostWithSource[]> {
  try {
    return getRelatedPosts(articleId, 3);
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }
}
