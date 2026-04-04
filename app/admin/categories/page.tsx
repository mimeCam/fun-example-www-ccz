/**
 * Admin Page for Category Management
 * Allows authors to create and manage content categories
 */

'use client';

import { useState, useEffect } from 'react';
import { CategoryWithStats } from '@/types/category';

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithStats | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

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

  function resetForm() {
    setName('');
    setSlug('');
    setDescription('');
    setColor('');
    setEditingCategory(null);
  }

  function startEdit(category: CategoryWithStats) {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || '');
    setColor(category.color || '');
  }

  async function saveCategory() {
    if (!name.trim()) {
      alert('Please enter a category name');
      return;
    }

    setSaving(true);
    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.slug}`
        : '/api/categories';

      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          color: color.trim() || undefined,
        }),
      });

      if (response.ok) {
        resetForm();
        await loadCategories();
        alert(
          editingCategory
            ? 'Category updated successfully!'
            : 'Category created successfully!'
        );
      } else {
        const error = await response.json();
        alert(
          `Failed to ${editingCategory ? 'update' : 'create'} category: ${error.error}`
        );
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert(`Failed to ${editingCategory ? 'update' : 'create'} category`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category: CategoryWithStats) {
    const message = category.articleCount > 0
      ? `This category has ${category.articleCount} article(s). Delete anyway?`
      : 'Delete this category?';

    if (!confirm(message)) return;

    try {
      const response = await fetch(`/api/categories/${category.slug}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadCategories();
        alert('Category deleted successfully!');
      } else {
        alert('Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  }

  // Auto-generate slug from name
  useEffect(() => {
    if (!editingCategory && name && !slug) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  }, [name, slug, editingCategory]);

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
        <h1 className="text-3xl font-bold mb-8">Category Management</h1>

        {/* Add/Edit category form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Productivity"
                className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g., productivity (auto-generated from name)"
                className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                URL-friendly version of the name. Leave empty to auto-generate.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this category..."
                rows={3}
                className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={color || '#6366f1'}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1 p-3 bg-gray-700 rounded border border-gray-600 text-white"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Hex color for category badges and links
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveCategory}
                disabled={saving || !name.trim()}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-opacity font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
              </button>

              {editingCategory && (
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-opacity-90 transition-opacity font-medium"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List existing categories */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Existing Categories ({categories.length})
          </h2>

          {categories.length === 0 ? (
            <p className="text-gray-400">No categories created yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="border border-gray-700 rounded p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {category.color && (
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                    </div>
                    <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">
                      {category.articleCount} {category.articleCount === 1 ? 'article' : 'articles'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-400 mb-1 font-mono">
                    /{category.slug}
                  </p>

                  {category.description && (
                    <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                      {category.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCategory(category)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
