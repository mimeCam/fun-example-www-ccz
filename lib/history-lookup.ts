/**
 * History Lookup - Find articles published on the same day in previous years
 * Follows Sid's philosophy: functions under 10 lines, pure and testable
 */

import { Article } from './content/ContentTagger';
import { getAllArticles } from './content/articleData';

export interface HistoricalArticle {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  yearsAgo: number;
  url: string;
}

/**
 * Get articles published on a specific date (month-day, ignoring year)
 */
export function getArticlesForDate(month: number, day: number): Article[] {
  const articles = getAllArticles();

  return articles.filter(article => {
    if (!article.publishedAt) return false;

    const date = new Date(article.publishedAt);
    return date.getMonth() + 1 === month && date.getDate() === day;
  });
}

/**
 * Get articles for today's date (month-day)
 */
export function getTodaysHistoricalArticles(): HistoricalArticle[] {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const currentYear = today.getFullYear();

  const articles = getArticlesForDate(month, day);

  return articles.map(article => {
    const publishedDate = new Date(article.publishedAt!);
    const yearsAgo = currentYear - publishedDate.getFullYear();
    const excerpt = article.content.substring(0, 150) + '...';

    return {
      id: article.id,
      title: article.title,
      excerpt,
      publishedAt: article.publishedAt!,
      yearsAgo,
      url: `/article/${article.id}`,
    };
  });
}

/**
 * Get articles within a date range
 */
export function getArticlesForDateRange(
  startDate: Date,
  endDate: Date
): Article[] {
  const articles = getAllArticles();

  return articles.filter(article => {
    if (!article.publishedAt) return false;

    const publishedDate = new Date(article.publishedAt);
    return publishedDate >= startDate && publishedDate <= endDate;
  });
}

/**
 * Format a historical message like "2 years ago today..."
 */
export function formatHistoricalMessage(
  article: Article,
  yearsAgo: number
): string {
  if (yearsAgo === 1) {
    return `One year ago today, I wrote "${article.title}"`;
  }

  return `${yearsAgo} years ago today, I wrote "${article.title}"`;
}
