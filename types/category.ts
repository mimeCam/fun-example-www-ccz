/**
 * Category Types - Content organization and discovery
 *
 * Category-based discovery system for organizing articles
 * into themed collections for better content exploration.
 */

/**
 * Category entity for organizing content
 */
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string; // Hex color for UI display
  createdAt: string;
}

/**
 * Article-category relationship (junction table)
 */
export interface ArticleCategory {
  articleId: string;
  categoryId: number;
}

/**
 * Category with article count (for admin UI)
 */
export interface CategoryWithStats extends Category {
  articleCount: number;
}

/**
 * Category with associated articles (for display)
 */
export interface CategoryWithArticles extends Category {
  articles: Array<{
    id: string;
    title: string;
  }>;
}

/**
 * Form data for creating/updating categories
 */
export interface CategoryFormData {
  name: string;
  slug?: string; // Optional - will be generated from name if not provided
  description?: string;
  color?: string;
}

/**
 * Validation result for category operations
 */
export interface CategoryValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}
