/**
 * Article Categories API Routes
 *
 * GET /api/articles/[id]/categories - Get categories for an article
 * PUT /api/articles/[id]/categories - Set categories for an article
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCategoriesForArticle, setCategoriesForArticle, getAllCategories } from '@/lib/db/categories';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/articles/[id]/categories
 * Get categories for an article
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const categories = getCategoriesForArticle(params.id);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching article categories:', error);

    return NextResponse.json(
      { error: 'Failed to fetch article categories' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/articles/[id]/categories
 * Set categories for an article (replaces all existing categories)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();

    // Validate category IDs
    if (!Array.isArray(body.categoryIds)) {
      return NextResponse.json(
        { error: 'categoryIds must be an array' },
        { status: 400 }
      );
    }

    // Verify all category IDs exist
    const allCategories = getAllCategories();
    const validCategoryIds = allCategories.map(c => c.id);
    const invalidIds = body.categoryIds.filter(
      (id: number) => !validCategoryIds.includes(id)
    );

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: 'Invalid category IDs', invalidIds },
        { status: 400 }
      );
    }

    setCategoriesForArticle(params.id, body.categoryIds);

    const updatedCategories = getCategoriesForArticle(params.id);

    return NextResponse.json(updatedCategories);
  } catch (error) {
    console.error('Error setting article categories:', error);

    return NextResponse.json(
      { error: 'Failed to set article categories' },
      { status: 500 }
    );
  }
}
