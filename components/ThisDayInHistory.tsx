/**
 * ThisDayInHistory - Widget showing articles published on this day in previous years
 * Displays nostalgic "on this day" content to help users discover older posts
 */

import { getTodaysHistoricalArticles } from '@/lib/history-lookup';

interface HistoricalArticle {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  yearsAgo: number;
  url: string;
}

/**
 * Server Component - Fetches historical articles at request time
 */
export async function ThisDayInHistory() {
  const articles: HistoricalArticle[] = await getTodaysHistoricalArticles();

  // Empty state - no historical posts for today
  if (articles.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl" role="img" aria-label="Calendar">
            📅
          </span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            On This Day
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No historical posts for today. Check back tomorrow!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl" role="img" aria-label="Calendar">
          📅
        </span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          On This Day in Blog History
        </h3>
      </div>

      <div className="space-y-4">
        {articles.map(article => (
          <div
            key={article.id}
            className="bg-white dark:bg-gray-900 rounded-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {article.yearsAgo === 1
                ? 'One year ago today, I wrote:'
                : `${article.yearsAgo} years ago today, I wrote:`}
            </p>

            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              {article.title}
            </h4>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {article.excerpt}
            </p>

            <a
              href={article.url}
              className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Read more
              <svg
                className="ml-1 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
