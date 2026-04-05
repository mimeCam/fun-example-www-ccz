/**
 * ContentTagger - Simple, stateless content analysis utility
 * Follows Sid's philosophy: functions under 10 lines, pure and testable
 */

export interface Article {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  publishedAt?: string; // ISO date string when article was published
  questions?: string[]; // Provocative questions for content discovery
}

export interface TaggedArticle extends Article {
  extractedTags: string[];
}

export interface RelatedArticle {
  article: Article;
  similarityScore: number;
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
]);

/**
 * Extract meaningful keywords from text using simple frequency analysis
 */
export function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !STOP_WORDS.has(word));

  const frequency = new Map<string, number>();
  words.forEach(word => frequency.set(word, (frequency.get(word) || 0) + 1));

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Calculate similarity between two tag sets using Jaccard index
 */
export function calculateSimilarity(tagsA: string[], tagsB: string[]): number {
  const setA = new Set(tagsA);
  const setB = new Set(tagsB);
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Tag an article with extracted keywords
 */
export function tagArticle(article: Article): TaggedArticle {
  const text = `${article.title} ${article.content}`;
  const extractedTags = extractKeywords(text);

  return { ...article, extractedTags };
}

/**
 * Find related articles based on tag similarity
 */
export function findRelatedArticles(
  currentArticle: Article,
  allArticles: Article[],
  maxResults: number = 3
): RelatedArticle[] {
  const taggedCurrent = tagArticle(currentArticle);
  const taggedAll = allArticles.map(tagArticle);

  return taggedAll
    .filter(a => a.id !== currentArticle.id)
    .map(article => ({
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
        tags: article.tags,
      },
      similarityScore: calculateSimilarity(taggedCurrent.extractedTags, article.extractedTags),
    }))
    .filter(r => r.similarityScore > 0.1)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, maxResults);
}

/**
 * Calculate reading time from content (words / 200 words per minute)
 */
export function estimateReadingTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.ceil(words / 200);
}
