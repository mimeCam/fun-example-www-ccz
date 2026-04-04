/**
 * Feedback system types for Exit-Intent Feedback System
 * Helps understand why users abandon after reading 1-3 posts
 */

export type FeedbackReason =
  | 'got-what-i-needed'
  | 'content-too-long'
  | 'content-too-dense'
  | 'want-more-examples'
  | 'felt-overwhelmed'
  | 'didnt-know-what-next'
  | 'other';

export interface Feedback {
  id: string;
  postId: string;
  timestamp: number;
  reason: FeedbackReason;
  comment?: string;
  timeOnPage?: number; // in seconds
  scrollDepth?: number; // percentage 0-100
  userAgent?: string;
}

export interface FeedbackFormData {
  reason: FeedbackReason;
  comment?: string;
}

export interface FeedbackDisplayReason {
  value: FeedbackReason;
  label: string;
  icon: string;
  description: string;
}

export const FEEDBACK_REASONS: FeedbackDisplayReason[] = [
  {
    value: 'got-what-i-needed',
    label: 'I got what I needed',
    icon: '✓',
    description: 'Found the answer I was looking for',
  },
  {
    value: 'content-too-long',
    label: 'The content was too long',
    icon: '📄',
    description: 'Too much text for the value provided',
  },
  {
    value: 'content-too-dense',
    label: 'The content was too dense',
    icon: '🧠',
    description: 'Ideas were packed too tightly',
  },
  {
    value: 'want-more-examples',
    label: 'I wanted more practical examples',
    icon: '💡',
    description: 'Need more concrete applications',
  },
  {
    value: 'felt-overwhelmed',
    label: 'I felt overwhelmed by the ideas',
    icon: '😵',
    description: 'Too much to process at once',
  },
  {
    value: 'didnt-know-what-next',
    label: "I didn't know what to read next",
    icon: '❓',
    description: 'No clear path forward',
  },
  {
    value: 'other',
    label: 'Other',
    icon: '💬',
    description: 'Something else (please explain)',
  },
];
