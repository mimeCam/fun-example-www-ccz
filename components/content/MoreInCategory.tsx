/**
 * More in Category Component
 *
 * Shows other articles in the same category
 * for content discovery
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Category } from '@/types/category';
import { Article } from '@/lib/content/ContentTagger';

interface MoreInCategoryProps {
  currentArticleId: string;
  category: Category;
  maxArticles?: number;
}

interface ArticleWithCategory extends Article {
  category?: Category;
}

export function MoreInCategory({
  currentArticleId,
  category,
  maxArticles = 3,
}: MoreInCategoryProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticles() {
      try {
        const response = await fetch(`/api/categories/${category.slug}`);
        if (response.ok) {
          const data = await response.json();
          // Filter out current article and limit results
          const otherArticles = (data.articles || [])
            .filter((a: Article) => a.id !== currentArticleId)
            .slice(0, maxArticles);

          setArticles(otherArticles);
        }
      } catch (error) {
        console.error('Error loading articles in category:', error);
      } finally {
        setLoading(false);
      }
    }

    loadArticles();
  }, [category.slug, currentArticleId, maxArticles]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">More in {category.name}</h3>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        {category.color && (
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: category.color }}
          />
        )}
        <h3 className="text-lg font-semibold">
          More in {category.name}
        </h3>
      </div>

      <ul className="space-y-3">
        {articles.map((article) => (
          <li key={article.id}>
            <Link
              href={`/article/${article.id}`}
              className="block p-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <h4 className="font-medium text-primary hover:underline">
                {article.title}
              </h4>
              {article.content && (
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                  {article.content.substring(0, 120)}...
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={`/categories/${category.slug}`}
        className="inline-block mt-4 text-sm text-primary hover:underline"
      >
        View all in {category.name} →
      </Link>
    </div>
  );
}
