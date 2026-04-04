/**
 * All Categories Page
 *
 * Lists all available categories
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CategoryWithStats } from '@/types/category';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">All Categories</h1>

        {categories.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">No categories yet.</p>
            <p className="text-sm text-gray-500">
              Categories help organize content and make discovery easier.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="block bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  {category.color && (
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                  <h2 className="text-xl font-semibold">{category.name}</h2>
                </div>

                {category.description && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {category.description}
                  </p>
                )}

                <p className="text-sm text-gray-400">
                  {category.articleCount}{' '}
                  {category.articleCount === 1 ? 'article' : 'articles'}
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* Admin link */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <Link
            href="/admin/categories"
            className="text-sm text-primary hover:underline"
          >
            Manage Categories →
          </Link>
        </div>
      </div>
    </div>
  );
}
