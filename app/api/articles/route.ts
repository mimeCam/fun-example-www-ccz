import { NextRequest, NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/content/articleData';

/**
 * Search API route
 * Performs simple text search over articles
 *
 * Force dynamic rendering because this route requires searchParams at request time
 */
export const dynamic = 'force-dynamic';

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
}

function generateSnippet(content: string, query: string, maxLength = 150): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);

  if (index === -1) {
    return content.substring(0, maxLength) + '...';
  }

  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + query.length + 50);
  let snippet = content.substring(start, end);

  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json([]);
  }

  const articles = getAllArticles();
  const lowerQuery = query.toLowerCase();

  // TODO: Add more sophisticated search (fuzzy matching, ranking, etc.)
  const results: SearchResult[] = articles
    .filter(article => {
      const titleMatch = article.title.toLowerCase().includes(lowerQuery);
      const contentMatch = article.content.toLowerCase().includes(lowerQuery);
      const tagMatch = article.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ?? false;

      return titleMatch || contentMatch || tagMatch;
    })
    .map(article => ({
      id: article.id,
      title: article.title,
      snippet: generateSnippet(article.content, query),
    }))
    .slice(0, 5); // Limit results

  // TODO: Add search analytics tracking

  return NextResponse.json(results);
}
