'use server';

import { getDb } from '@/lib/db';
import { z } from 'zod';

/**
 * Zod schema for email validation.
 * Simple, reusable, and type-safe.
 */
const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  postType: z.enum(['technical', 'design', 'personal', 'business', 'general']),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

/**
 * Server action: Subscribe a user to the newsletter.
 * Validates email, checks for duplicates, and stores in SQLite.
 *
 * @param formData - Form data containing email and postType
 * @returns Object with success status and message
 */
export async function subscribeToNewsletter(formData: FormData): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Extract and validate data
    const email = formData.get('email') as string;
    const postType = formData.get('postType') as string;

    const result = subscribeSchema.safeParse({ email, postType });

    if (!result.success) {
      return {
        success: false,
        message: 'Please enter a valid email address.',
      };
    }

    const db = getDb();

    // Check if email already exists
    const existing = db
      .prepare('SELECT id FROM newsletter_subscribers WHERE email = ?')
      .get(result.data.email);

    if (existing) {
      return {
        success: false,
        message: 'You\'re already subscribed!',
      };
    }

    // Insert new subscriber
    db.prepare(
      'INSERT INTO newsletter_subscribers (email, sourcePostType) VALUES (?, ?)'
    ).run(result.data.email, result.data.postType);

    return {
      success: true,
      message: 'Welcome! Check your inbox to confirm.',
    };

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return {
      success: false,
      message: 'Something went wrong. Please try again.',
    };
  }
}

/**
 * Server action: Get current subscriber count.
 * Used for displaying social proof numbers.
 *
 * @returns Total number of active subscribers
 */
export async function getSubscriberCount(): Promise<number> {
  try {
    const db = getDb();
    const result = db
      .prepare('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE status = ?')
      .get('active') as { count: number };

    return result.count;
  } catch (error) {
    console.error('Error fetching subscriber count:', error);
    return 0;
  }
}

// TODO: Add email confirmation flow with verification tokens
// TODO: Add unsubscribe functionality
// TODO: Add subscriber segmentation by post type preferences
