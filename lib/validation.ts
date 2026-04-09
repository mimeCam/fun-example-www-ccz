import { z } from 'zod';

// Shared validation schemas for the challenge feature

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

// Comment validation schemas for Thoughtful Conversations
// Minimum 100 words, maximum 2000 characters
export const createCommentSchema = z.object({
  articleId: z.string().min(1, 'Article ID is required'),
  authorName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  authorEmail: z.string().email('Invalid email address'),
  content: z.string()
    .min(100, 'Comment must be at least 100 words to ensure thoughtful discussion')
    .max(5000, 'Comment must not exceed 5000 characters')
    .refine(
      (text) => {
        const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        return wordCount >= 100;
      },
      'Comment must be at least 100 words to ensure thoughtful discussion'
    ),
  parentId: z.number().optional(),
});

export const commentIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid comment ID').transform(Number),
});

export const createCommentUpvoteSchema = z.object({
  commentId: z.number().int().positive('Invalid comment ID'),
  userEmail: z.string().email('Invalid email address'),
  voteType: z.enum(['up', 'down'], {
    errorMap: () => ({ message: 'Vote type must be either up or down' }),
  }),
});

// Type exports
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateCommentUpvoteInput = z.infer<typeof createCommentUpvoteSchema>;

// Resonance validation schemas for Resonance-First Bookmarking System
// Mandatory resonance note (280 char max), optional quote capture
export const createResonanceSchema = z.object({
  articleId: z.string().min(1, 'Article ID is required'),
  email: z.string().email('Invalid email address'),
  resonanceNote: z.string()
    .min(1, 'Resonance note is required - why does this resonate with you?')
    .max(280, 'Resonance note must be 280 characters or less'),
  quote: z.string().max(500, 'Quote must be 500 characters or less').optional(),
});

export const updateResonanceSchema = z.object({
  email: z.string().email('Invalid email address'),
  resonanceNote: z.string().max(280, 'Resonance note must be 280 characters or less').optional(),
  quote: z.string().max(500, 'Quote must be 500 characters or less').optional(),
  status: z.enum(['active', 'archived', 'considered']).optional(),
});

export const recordVisitSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Type exports
export type CreateResonanceInput = z.infer<typeof createResonanceSchema>;
export type UpdateResonanceInput = z.infer<typeof updateResonanceSchema>;
export type RecordVisitInput = z.infer<typeof recordVisitSchema>;

// Feedback validation schemas for Exit-Intent Feedback System
export const createFeedbackSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  reason: z.string().min(1, 'Reason is required'),
  comment: z.string().max(500, 'Comment must not exceed 500 characters').optional(),
  timeOnPage: z.number().min(0, 'Time on page must be positive').optional(),
  scrollDepth: z.number().min(0).max(100, 'Scroll depth must be between 0 and 100').optional(),
});

// Type exports
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
