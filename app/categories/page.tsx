/**
 * All Categories Page
 *
 * Lists all available categories
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GemHome } from '@/components/navigation/GemHome';
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
      <div className="min-h-screen p-8 bg-background">
        <GemHome />
        <p className="text-mist">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <GemHome />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-display font-bold mb-8 text-[#f0f0f5]">
          All Categories
        </h1>

        {categories.length === 0 ? (
          <div className="bg-surface rounded-xl p-8 text-center shadow-void">
            <p className="text-mist mb-4">No categories yet.</p>
            <p className="text-sm text-mist/60">
              Categories help organize content and make discovery easier.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="block bg-surface rounded-xl p-6 hover:bg-fog transition-colors shadow-void hover:shadow-rise"
              >
                <div className="flex items-center gap-3 mb-3">
                  {category.color && (
                    <div
                      className="w-4 h-4 rounded-md"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                  <h2 className="text-xl font-semibold text-[#f0f0f5]">{category.name}</h2>
                </div>

                {category.description && (
                  <p className="text-[#f0f0f5]/80 text-sm mb-4 line-clamp-2">
                    {category.description}
                  </p>
                )}

                <p className="text-sm text-mist">
                  {category.articleCount}{' '}
                  {category.articleCount === 1 ? 'article' : 'articles'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
