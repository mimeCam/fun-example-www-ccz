import { z } from 'zod';

// Shared validation schemas for the challenge feature
// TODO: Add more validation rules as needed

export const createChallengeSchema = z.object({
  articleId: z.string().min(1, 'Article ID is required'),
  authorName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  authorEmail: z.string().email('Invalid email address'),
  challengeText: z.string().min(10, 'Challenge must be at least 10 characters').max(2000),
});

export const challengeIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid challenge ID').transform(Number),
});

// Type exports
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
