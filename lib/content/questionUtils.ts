/**
 * QuestionUtils - Content discovery through provocative questions
 * Following Sid's philosophy: functions under 10 lines, pure and testable
 */

import type { Article } from './ContentTagger';

export interface QuestionWithArticle {
  question: string;
  articleId: string;
  articleTitle: string;
}

/**
 * Extract all questions from articles with context
 */
export function getAllQuestions(articles: Article[]): QuestionWithArticle[] {
  return articles
    .filter(article => article.questions?.length)
    .flatMap(article =>
      article.questions!.map(question => ({
        question,
        articleId: article.id,
        articleTitle: article.title,
      }))
    );
}

/**
 * Search questions by keyword
 */
export function searchQuestions(
  questions: QuestionWithArticle[],
  query: string
): QuestionWithArticle[] {
  const lowerQuery = query.toLowerCase();
  return questions.filter(({ question, articleTitle }) =>
    question.toLowerCase().includes(lowerQuery) ||
    articleTitle.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get random selection of questions for serendipity
 */
export function getRandomQuestions(
  questions: QuestionWithArticle[],
  count: number
): QuestionWithArticle[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, questions.length));
}

/**
 * Find questions for a specific article
 */
export function getQuestionsForArticle(
  articles: Article[],
  articleId: string
): string[] {
  return articles.find(a => a.id === articleId)?.questions || [];
}
