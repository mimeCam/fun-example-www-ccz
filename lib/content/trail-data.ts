/**
 * Sample Curiosity Trail Data
 * Author-curated semantic trails for testing and demonstration
 */

import type { Trail } from '../../types/trail';

/**
 * Sample trails demonstrating different learning paths
 * In production, these would come from a database or CMS
 */
export const SAMPLE_TRAILS: Trail[] = [
  {
    id: 'intellectual-growth',
    name: 'Intellectual Growth Path',
    description: 'Develop critical thinking and lifelong learning habits',
    estimatedTime: '25 min',
    articleIds: ['art-of-challenging', 'learning-strategies', 'systems-thinking'],
    connections: [
      {
        fromArticleId: 'art-of-challenging',
        toArticleId: 'learning-strategies',
        connectionType: 'extension',
        reason: 'Now that you can challenge ideas, learn how to acquire new ones effectively',
        difficultyLevel: 2
      },
      {
        fromArticleId: 'learning-strategies',
        toArticleId: 'systems-thinking',
        connectionType: 'extension',
        reason: 'Apply learning strategies to understand complex interconnected systems',
        difficultyLevel: 3
      }
    ],
    metadata: {
      createdAt: '2024-04-05T10:00:00Z',
      updatedAt: '2024-04-05T10:00:00Z',
      category: 'personal-development',
      difficulty: 2,
      author: 'Persona Blog'
    }
  },
  {
    id: 'technical-leadership',
    name: 'Technical Leadership Journey',
    description: 'From technical excellence to leadership impact',
    estimatedTime: '15 min',
    articleIds: ['deep-work', 'effective-communication', 'design-principles'],
    connections: [
      {
        fromArticleId: 'deep-work',
        toArticleId: 'effective-communication',
        connectionType: 'extension',
        reason: 'Deep work gives you technical depth. Communication multiplies your impact.',
        difficultyLevel: 3
      },
      {
        fromArticleId: 'effective-communication',
        toArticleId: 'design-principles',
        connectionType: 'practical',
        reason: 'Apply communication skills to design better developer tools',
        difficultyLevel: 4
      }
    ],
    metadata: {
      createdAt: '2024-04-05T11:00:00Z',
      updatedAt: '2024-04-05T11:00:00Z',
      category: 'leadership',
      difficulty: 3,
      author: 'Persona Blog'
    }
  }
];

/**
 * Get all trails
 */
export function getAllTrails(): Trail[] {
  return SAMPLE_TRAILS;
}

/**
 * Get trail by ID
 */
export function getTrailById(id: string): Trail | undefined {
  return SAMPLE_TRAILS.find(trail => trail.id === id);
}

/**
 * Get trails that include a specific article
 */
export function getTrailsContainingArticle(articleId: string): Trail[] {
  return SAMPLE_TRAILS.filter(trail =>
    trail.articleIds.includes(articleId)
  );
}

/**
 * Get trail for a specific article (first trail that contains it)
 */
export function getTrailForArticle(articleId: string): Trail | undefined {
  return getTrailsContainingArticle(articleId)[0];
}
