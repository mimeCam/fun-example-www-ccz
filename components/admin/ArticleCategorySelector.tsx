/**
 * Article Category Assignment Component
 *
 * Allows admins to assign categories to articles
 * Can be integrated into article editing interface
 */

'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/types/category';

interface ArticleCategorySelectorProps {
  articleId: string;
  articleTitle?: string;
}

export function ArticleCategorySelector({
  articleId,
  articleTitle,
}: ArticleCategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [articleId]);

  async function loadData() {
    try {
      // Load all categories
      const catsResponse = await fetch('/api/categories');
      if (catsResponse.ok) {
        const allCategories = await catsResponse.json();
        setCategories(allCategories);
      }

      // Load article's current categories
      const articleResponse = await fetch(`/api/articles/${articleId}/categories`);
      if (articleResponse.ok) {
        const articleCategories = await articleResponse.json();
        setSelectedCategories(articleCategories.map((c: Category) => c.id));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveCategories() {
    setSaving(true);
    try {
      const response = await fetch(`/api/articles/${articleId}/categories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds: selectedCategories }),
      });

      if (response.ok) {
        alert('Categories updated successfully!');
      } else {
        alert('Failed to update categories');
      }
    } catch (error) {
      console.error('Error saving categories:', error);
      alert('Failed to update categories');
    } finally {
      setSaving(false);
    }
  }

  function toggleCategory(categoryId: number) {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  }

  if (loading) {
    return <div className="text-gray-400">Loading categories...</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        Categories for "{articleTitle || articleId}"
      </h3>

      {categories.length === 0 ? (
        <p className="text-gray-400 mb-4">
          No categories yet.{' '}
          <a href="/admin/categories" className="text-primary hover:underline">
            Create some categories
          </a>{' '}
          first.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.id);

              return (
                <label
                  key={category.id}
                  className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary bg-opacity-10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCategory(category.id)}
                    className="w-4 h-4"
                  />
                  {category.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                  <span className="flex-1">{category.name}</span>
                </label>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveCategories}
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-opacity font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Categories'}
            </button>

            <button
              onClick={() => setSelectedCategories([])}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-opacity-90 transition-opacity font-medium"
            >
              Clear All
            </button>
          </div>
        </>
      )}

      <div className="mt-4 pt-4 border-t border-gray-700">
        <a
          href="/admin/categories"
          className="text-sm text-primary hover:underline"
        >
          Manage Categories →
        </a>
      </div>
    </div>
  );
}
