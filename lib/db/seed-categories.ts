/**
 * Seed Categories Script
 *
 * Creates initial categories and assigns them to sample articles
 * Run this once to populate the database with starter categories
 */

import { createCategory } from './categories';
import { setCategoriesForArticle } from './categories';
import { getAllArticles } from '../content/articleData';

/**
 * Seed categories and assign to articles
 */
export function seedCategories() {
  console.log('Seeding categories...');

  try {
    // Create categories
    const categories = [
      {
        name: 'Productivity',
        slug: 'productivity',
        description: 'Tips and strategies for getting more done with less effort',
        color: '#10b981', // Emerald green
      },
      {
        name: 'Leadership',
        slug: 'leadership',
        description: 'Insights on leading teams and organizations effectively',
        color: '#3b82f6', // Blue
      },
      {
        name: 'Design',
        slug: 'design',
        description: 'Design principles, patterns, and best practices',
        color: '#ec4899', // Pink
      },
      {
        name: 'Personal Development',
        slug: 'personal-development',
        description: 'Strategies for growth, learning, and self-improvement',
        color: '#f59e0b', // Amber
      },
      {
        name: 'Systems Thinking',
        slug: 'systems-thinking',
        description: 'Understanding complex systems and interconnected problems',
        color: '#8b5cf6', // Violet
      },
      {
        name: 'Communication',
        slug: 'communication',
        description: 'Effective communication for technical professionals',
        color: '#06b6d4', // Cyan
      },
    ];

    const createdCategories: number[] = [];

    for (const cat of categories) {
      try {
        const category = createCategory(cat);
        if (category) {
          createdCategories.push(category.id);
          console.log(`✓ Created category: ${category.name}`);
        }
      } catch (error: any) {
        // Category might already exist, that's okay
        console.log(`- Category "${cat.name}" may already exist`);
      }
    }

    // Assign categories to sample articles
    const articles = getAllArticles();

    const articleCategoryMap: Record<string, number[]> = {
      'art-of-challenging': [1, 2], // Productivity, Leadership
      'deep-work': [1], // Productivity
      'systems-thinking': [5], // Systems Thinking
      'effective-communication': [6, 2], // Communication, Leadership
      'learning-strategies': [4, 1], // Personal Development, Productivity
      'design-principles': [3], // Design
    };

    for (const [articleId, categoryIds] of Object.entries(articleCategoryMap)) {
      try {
        setCategoriesForArticle(articleId, categoryIds);
        console.log(`✓ Assigned categories to article: ${articleId}`);
      } catch (error) {
        console.error(`✗ Failed to assign categories to ${articleId}:`, error);
      }
    }

    console.log('\n✓ Categories seeded successfully!');
    console.log('\nNext steps:');
    console.log('1. Visit /admin/categories to manage categories');
    console.log('2. Visit /categories to see all categories');
    console.log('3. Visit /article/art-of-challenging to see category badges');
  } catch (error) {
    console.error('Error seeding categories:', error);
  }
}

/**
 * CLI entry point for seeding
 */
if (require.main === module) {
  seedCategories();
}
