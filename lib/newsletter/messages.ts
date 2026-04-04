/**
 * Message templates for the contextual newsletter widget.
 * Each post type gets a specific message with targeted social proof.
 */

export type PostType = 'technical' | 'design' | 'personal' | 'business' | 'general';

export interface NewsletterMessage {
  headline: string;
  socialProof: string;
}

/**
 * Pure function: Maps post type to contextual message.
 * This is the core "smart" part of the widget - no side effects, just data transformation.
 *
 * @param postType - The type of blog post being read
 * @returns A message object with headline and social proof
 */
export function selectMessage(postType: PostType): NewsletterMessage {
  const messages: Record<PostType, NewsletterMessage> = {
    technical: {
      headline: "Want more deep-dives like this?",
      socialProof: "5,234 builders & developers"
    },
    design: {
      headline: "Love design thinking?",
      socialProof: "3,102 designers & makers"
    },
    personal: {
      headline: "Enjoy stories about building?",
      socialProof: "2,847 curious minds"
    },
    business: {
      headline: "Building something meaningful?",
      socialProof: "4,521 founders & strategists"
    },
    general: {
      headline: "You're here for a reason.",
      socialProof: "6,892 thoughtful readers"
    }
  };

  return messages[postType] || messages.general;
}

// TODO: Add A/B testing variants for messages
// TODO: Consider adding seasonal/time-based message variations
