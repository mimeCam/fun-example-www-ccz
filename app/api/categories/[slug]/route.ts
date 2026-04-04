/**
 * Category Detail API Routes
 *
 * GET /api/categories/[slug] - Get a category by slug
 * PUT /api/categories/[slug] - Update a category
 * DELETE /api/categories/[slug] - Delete a category
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCategoryBySlug, getCategoryWithArticles, updateCategory, deleteCategory } from '@/lib/db/categories';
import { CategoryFormData } from '@/types/category';

interface RouteParams {
  params: {
    slug: string;
  };
}

/**
 * GET /api/categories/[slug]
 * Get a category by slug with its articles
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const category = getCategoryWithArticles(params.slug);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);

    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories/[slug]
 * Update a category
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const existing = getCategoryBySlug(params.slug);

    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Validate request body
    const data: Partial<CategoryFormData> = {
      name: body.name,
      slug: body.slug,
      description: body.description,
      color: body.color,
    };

    const category = updateCategory(existing.id, data);

    if (!category) {
      return NextResponse.json(
        { error: 'Failed to update category' },
        { status: 500 }
      );
    }

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error updating category:', error);

    // Handle validation errors
    if (error.message.includes('[')) {
      try {
        const validationErrors = JSON.parse(error.message);
        return NextResponse.json(
          { error: 'Validation failed', details: validationErrors },
          { status: 400 }
        );
      } catch {
        // If JSON parsing fails, return original error
      }
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/categories/[slug]
 * Delete a category
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const category = getCategoryBySlug(params.slug);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const success = deleteCategory(category.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);

    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
