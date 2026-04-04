/**
 * Categories API Routes
 *
 * GET /api/categories - Get all categories
 * POST /api/categories - Create a new category
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllCategoriesWithStats, createCategory } from '@/lib/db/categories';
import { CategoryFormData } from '@/types/category';

/**
 * GET /api/categories
 * Get all categories with article counts
 */
export async function GET() {
  try {
    const categories = getAllCategoriesWithStats();

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);

    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const data: CategoryFormData = {
      name: body.name,
      slug: body.slug,
      description: body.description,
      color: body.color,
    };

    const category = createCategory(data);

    if (!category) {
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);

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
      { error: error.message || 'Failed to create category' },
      { status: 400 }
    );
  }
}
