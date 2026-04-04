'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SavedArticle {
  id: string;
  title: string;
  savedAt: number;
}

/**
 * Saved Articles Page
 *
 * Design Philosophy:
 * - Simple, clean list layout
 * - No complex management UI
 * - Easy to remove articles
 * - Shows when article was saved
 */
export default function SavedArticlesPage() {
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedArticles();
  }, []);

  const loadSavedArticles = () => {
    try {
      const saved = localStorage.getItem('saved-articles');
      const articleIds: string[] = saved ? JSON.parse(saved) : [];

      // In production, you'd fetch full article data from a database
      // For now, we'll create a simple mock based on the IDs
      const articles: SavedArticle[] = articleIds.map(id => {
        const savedAt = localStorage.getItem(`saved-${id}-at`);
        return {
          id,
          title: `Article ${id}`, // In production, fetch from database
          savedAt: savedAt ? parseInt(savedAt, 10) : Date.now(),
        };
      });

      setSavedArticles(articles);
    } catch (e) {
      console.error('Failed to load saved articles:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const removeArticle = (articleId: string) => {
    try {
      const saved = localStorage.getItem('saved-articles');
      const articleIds: string[] = saved ? JSON.parse(saved) : [];
      const newIds = articleIds.filter(id => id !== articleId);
      localStorage.setItem('saved-articles', JSON.stringify(newIds));
      loadSavedArticles();
    } catch (e) {
      console.error('Failed to remove article:', e);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Saved today';
    if (diffDays === 1) return 'Saved yesterday';
    if (diffDays < 7) return `Saved ${diffDays} days ago`;
    return `Saved ${date.toLocaleDateString()}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-8">Saved Articles</h1>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-primary mb-2">Saved Articles</h1>
          <p className="text-gray-400">
            {savedArticles.length === 0
              ? 'You haven\'t saved any articles yet.'
              : `${savedArticles.length} article${savedArticles.length > 1 ? 's' : ''} saved for later`}
          </p>
        </header>

        {savedArticles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              Click the bookmark icon on any article to save it here.
            </p>
            <Link
              href="/"
              className="text-primary hover:text-secondary transition-colors"
            >
              Browse Articles →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedArticles.map(article => (
              <div
                key={article.id}
                className="flex items-center justify-between p-6 bg-surface rounded-lg hover:bg-opacity-80 transition-colors"
              >
                <div className="flex-1">
                  <Link
                    href={`/article/${article.id}`}
                    className="text-xl font-semibold text-primary hover:text-secondary transition-colors"
                  >
                    {article.title}
                  </Link>
                  <p className="text-sm text-gray-400 mt-1">
                    {formatDate(article.savedAt)}
                  </p>
                </div>

                <button
                  onClick={() => removeArticle(article.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  aria-label="Remove from saved"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
