import { NextRequest, NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/content/articleData';
import {
  getAllQuestions,
  searchQuestions,
  getRandomQuestions,
} from '@/lib/content/questionUtils';

/**
 * Questions API - Content discovery through provocative questions
 *
 * Force dynamic rendering because this route requires searchParams at request time
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get('mode') || 'all'; // all | search | random
  const query = searchParams.get('q') || '';
  const count = parseInt(searchParams.get('count') || '10');

  const articles = getAllArticles();
  const allQuestions = getAllQuestions(articles);

  if (mode === 'search' && query) {
    const results = searchQuestions(allQuestions, query);
    return NextResponse.json(results.slice(0, count));
  }

  if (mode === 'random') {
    const results = getRandomQuestions(allQuestions, count);
    return NextResponse.json(results);
  }

  // Default: return all questions
  return NextResponse.json(allQuestions);
}
