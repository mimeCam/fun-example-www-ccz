/**
 * Category Archive Page
 *
 * Shows all articles in a specific category
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { GemHome } from '@/components/navigation/GemHome';
import { CategoryWithArticles } from '@/types/category';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<CategoryWithArticles | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategory() {
      try {
        const response = await fetch(`/api/categories/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setCategory(data);
        }
      } catch (error) {
        console.error('Error loading category:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCategory();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-background">
        <GemHome />
        <p className="text-mist">Loading...</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen p-8 bg-background">
        <GemHome />
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[#f0f0f5] mb-4">Category Not Found</h1>
          <p className="text-mist mb-8">
            The category &quot;{slug}&quot; does not exist.
          </p>
          <Link href="/categories" className="text-accent hover:text-primary transition-colors text-sm">
            Browse all categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <GemHome />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {category.color && (
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: category.color }}
              />
            )}
            <h1 className="text-4xl font-bold text-[#f0f0f5]">{category.name}</h1>
          </div>

          {category.description && (
            <p className="text-xl text-[#f0f0f5]/80">{category.description}</p>
          )}

          <p className="text-sm text-mist mt-2">
            {category.articles.length}{' '}
            {category.articles.length === 1 ? 'article' : 'articles'}
          </p>
        </div>

        {/* Articles */}
        {category.articles.length === 0 ? (
          <div className="bg-surface rounded-xl p-8 text-center shadow-void">
            <p className="text-mist">No articles in this category yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {category.articles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className="block bg-surface rounded-xl p-6 hover:bg-fog transition-colors shadow-void hover:shadow-rise"
              >
                <h2 className="text-xl font-semibold text-primary hover:underline">
                  {article.title}
                </h2>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
