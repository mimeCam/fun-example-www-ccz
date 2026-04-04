/**
 * Category CRUD Operations
 *
 * Database operations for managing categories and article-category relationships
 * Follows Sid's philosophy: small, focused functions with clear responsibilities
 */

import Database from 'better-sqlite3';
import { getDb } from '../db';
import {
  Category,
  CategoryWithStats,
  CategoryWithArticles,
  CategoryFormData,
  CategoryValidationResult,
} from '@/types/category';

/**
 * Generate slug from category name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Validate category data
 */
function validateCategory(data: CategoryFormData): CategoryValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (data.name && data.name.length > 100) {
    errors.push({ field: 'name', message: 'Name must be less than 100 characters' });
  }

  if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
    errors.push({ field: 'slug', message: 'Slug can only contain lowercase letters, numbers, and hyphens' });
  }

  if (data.description && data.description.length > 500) {
    errors.push({ field: 'description', message: 'Description must be less than 500 characters' });
  }

  if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
    errors.push({ field: 'color', message: 'Color must be a valid hex color (e.g., #FF5733)' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a new category
 */
export function createCategory(data: CategoryFormData): Category | null {
  const validation = validateCategory(data);
  if (!validation.valid) {
    throw new Error(JSON.stringify(validation.errors));
  }

  const db = getDb();
  const slug = data.slug || generateSlug(data.name);

  try {
    const result = db.prepare(
      'INSERT INTO categories (name, slug, description, color) VALUES (?, ?, ?, ?)'
    ).run(data.name, slug, data.description || null, data.color || null);

    const category = getCategoryById(result.lastInsertRowid as number);
    return category;
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw new Error('Category with this name or slug already exists');
    }
    throw error;
  }
}

/**
 * Get category by ID
 */
export function getCategoryById(id: number): Category | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

  if (!row) return null;

  return row as Category;
}

/**
 * Get category by slug
 */
export function getCategoryBySlug(slug: string): Category | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);

  if (!row) return null;

  return row as Category;
}

/**
 * Get all categories
 */
export function getAllCategories(): Category[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM categories ORDER BY name').all() as Category[];

  return rows;
}

/**
 * Get all categories with article counts
 */
export function getAllCategoriesWithStats(): CategoryWithStats[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      c.*,
      COUNT(ac.articleId) as articleCount
    FROM categories c
    LEFT JOIN article_categories ac ON c.id = ac.categoryId
    GROUP BY c.id
    ORDER BY c.name
  `).all() as CategoryWithStats[];

  return rows;
}

/**
 * Update category
 */
export function updateCategory(id: number, data: Partial<CategoryFormData>): Category | null {
  const existing = getCategoryById(id);
  if (!existing) {
    throw new Error('Category not found');
  }

  const validation = validateCategory({ ...existing, ...data });
  if (!validation.valid) {
    throw new Error(JSON.stringify(validation.errors));
  }

  const db = getDb();
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }

  if (data.slug !== undefined) {
    updates.push('slug = ?');
    values.push(data.slug);
  } else if (data.name !== undefined && !data.slug) {
    updates.push('slug = ?');
    values.push(generateSlug(data.name));
  }

  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description || null);
  }

  if (data.color !== undefined) {
    updates.push('color = ?');
    values.push(data.color || null);
  }

  if (updates.length === 0) return existing;

  values.push(id);

  db.prepare(
    `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`
  ).run(...values);

  return getCategoryById(id);
}

/**
 * Delete category
 */
export function deleteCategory(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);

  return result.changes > 0;
}

/**
 * Get categories for an article
 */
export function getCategoriesForArticle(articleId: string): Category[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.*
    FROM categories c
    JOIN article_categories ac ON c.id = ac.categoryId
    WHERE ac.articleId = ?
    ORDER BY c.name
  `).all(articleId) as Category[];

  return rows;
}

/**
 * Set categories for an article (replaces all existing categories)
 */
export function setCategoriesForArticle(articleId: string, categoryIds: number[]): void {
  const db = getDb();

  // Start transaction
  const transaction = db.transaction(() => {
    // Delete existing categories
    db.prepare('DELETE FROM article_categories WHERE articleId = ?').run(articleId);

    // Add new categories
    if (categoryIds.length > 0) {
      const insert = db.prepare(
        'INSERT INTO article_categories (articleId, categoryId) VALUES (?, ?)'
      );

      for (const categoryId of categoryIds) {
        insert.run(articleId, categoryId);
      }
    }
  });

  transaction();
}

/**
 * Add a category to an article
 */
export function addCategoryToArticle(articleId: string, categoryId: number): void {
  const db = getDb();

  try {
    db.prepare(
      'INSERT INTO article_categories (articleId, categoryId) VALUES (?, ?)'
    ).run(articleId, categoryId);
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      throw new Error('Category already added to this article');
    }
    throw error;
  }
}

/**
 * Remove a category from an article
 */
export function removeCategoryFromArticle(articleId: string, categoryId: number): boolean {
  const db = getDb();
  const result = db.prepare(
    'DELETE FROM article_categories WHERE articleId = ? AND categoryId = ?'
  ).run(articleId, categoryId);

  return result.changes > 0;
}

/**
 * Get articles in a category
 */
export function getArticlesInCategory(categoryId: number): Array<{
  id: string;
  title: string;
}> {
  const db = getDb();

  // This is a simple implementation - in production you'd join with articles table
  const rows = db.prepare(`
    SELECT DISTINCT ac.articleId as id
    FROM article_categories ac
    WHERE ac.categoryId = ?
  `).all(categoryId) as Array<{ id: string }>;

  // For now, we'll return just the IDs
  // In a full implementation, you'd join with the articles table
  return rows.map(row => ({
    id: row.id,
    title: row.id, // Fallback until we have proper articles table
  }));
}

/**
 * Get category with articles
 */
export function getCategoryWithArticles(slug: string): CategoryWithArticles | null {
  const category = getCategoryBySlug(slug);
  if (!category) return null;

  const articles = getArticlesInCategory(category.id);

  return {
    ...category,
    articles,
  };
}
