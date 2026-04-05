/**
 * SearchIndex - Build-time search index with Fuse.js fuzzy matching
 * Follows Sid's philosophy: small, pure functions, clear purpose
 */

import Fuse, { type IFuseOptions, type FuseResult } from 'fuse.js';
import { Article } from '@/lib/content/ContentTagger';
import { getAllArticles } from '@/lib/content/articleData';

export interface SearchDocument {
  id: string;
  title: string;
  content: string;
  tags: string[];
  publishedAt: string;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  score: number;
  matchedTags: string[];
}

// Configure Fuse.js for optimal article search
const fuseOptions: IFuseOptions<SearchDocument> = {
  keys: [
    { name: 'title', weight: 3.0 },      // Title matches are most important
    { name: 'tags', weight: 2.0 },       // Tag matches are very important
    { name: 'content', weight: 1.0 },    // Content matches are standard
  ],
  threshold: 0.4,                        // Lower = more strict matching (0.0 = exact, 1.0 = match anything)
  distance: 100,                         // Maximum character distance for fuzzy matching
  minMatchCharLength: 2,                 // Minimum character length to match
  includeScore: true,                    // Include relevance score in results
  includeMatches: true,                  // Include match info for highlighting
};

/**
 * Build search index from all articles
 * Called at build time to create optimized search structure
 */
export function buildSearchIndex() {
  const articles = getAllArticles();
  const searchDocuments: SearchDocument[] = articles.map(article => ({
    id: article.id,
    title: article.title,
    content: article.content,
    tags: article.tags || [],
    publishedAt: article.publishedAt || '',
  }));

  return new Fuse(searchDocuments, fuseOptions);
}

/**
 * Generate contextual snippet highlighting the matched term
 */
export function generateSnippet(content: string, query: string, maxLength = 150): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);

  // If no direct match, return beginning of content
  if (index === -1) {
    return content.substring(0, maxLength) + '...';
  }

  // Generate snippet around the match
  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + query.length + 50);
  let snippet = content.substring(start, end);

  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Extract matched tags from Fuse.js result
 */
export function extractMatchedTags(result: FuseResult<SearchDocument>): string[] {
  const matchedTags: string[] = [];

  if (result.matches) {
    const tagMatch = result.matches.find(match => match.key === 'tags');
    if (tagMatch?.indices) {
      tagMatch.indices.forEach(([start, end]) => {
        const tagValue = result.item.tags[start];
        if (tagValue && !matchedTags.includes(tagValue)) {
          matchedTags.push(tagValue);
        }
      });
    }
  }

  return matchedTags;
}

/**
 * Perform fuzzy search with relevance ranking
 */
export function searchArticles(
  fuse: ReturnType<typeof buildSearchIndex>,
  query: string,
  maxResults = 8
): SearchResult[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const results = fuse.search(query);

  return results
    .slice(0, maxResults)
    .map(result => ({
      id: result.item.id,
      title: result.item.title,
      snippet: generateSnippet(result.item.content, query),
      score: result.score || 0,
      matchedTags: extractMatchedTags(result),
    }));
}

/**
 * Get singleton instance of search index
 * In production, this would be cached or built at compile time
 */
let searchIndexCache: ReturnType<typeof buildSearchIndex> | null = null;

export function getSearchIndex() {
  if (!searchIndexCache) {
    searchIndexCache = buildSearchIndex();
  }
  return searchIndexCache;
}
