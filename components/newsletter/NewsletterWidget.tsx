'use client';

import { useState, useTransition } from 'react';
import { subscribeToNewsletter } from '@/lib/newsletter/actions';
import { selectMessage, type PostType } from '@/lib/newsletter/messages';

interface NewsletterWidgetProps {
  postType: PostType;
}

/**
 * NewsletterWidget - Contextual newsletter signup form.
 *
 * Displays a targeted message based on post type, with email input.
 * Uses Server Actions for secure form handling without API routes.
 */
export function NewsletterWidget({ postType }: NewsletterWidgetProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const messageData = selectMessage(postType);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');

    const formData = new FormData();
    formData.append('email', email);
    formData.append('postType', postType);

    startTransition(async () => {
      const result = await subscribeToNewsletter(formData);
      setStatus(result.success ? 'success' : 'error');
      setMessage(result.message);

      if (result.success) {
        setEmail('');
      }
    });
  };

  return (
    <aside className="sticky top-8">
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg">
        {/* Headline - contextual based on post type */}
        <h3 className="text-lg font-semibold mb-2 text-white">
          {messageData.headline}
        </h3>

        {/* Social proof - also contextual */}
        <p className="text-sm text-gray-400 mb-4">
          Join {messageData.socialProof}
        </p>

        {/* Form */}
        {status === 'success' ? (
          <div className="text-green-400 text-sm font-medium">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={isPending}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label="Email address for newsletter"
            />

            <button
              type="submit"
              disabled={isPending || !email}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isPending ? 'Subscribing...' : 'Subscribe'}
            </button>

            {status === 'error' && (
              <p className="text-red-400 text-sm">{message}</p>
            )}
          </form>
        )}

        {/* Privacy note */}
        <p className="text-xs text-gray-500 mt-4">
          No spam, ever. Unsubscribe anytime.
        </p>

        {/* TODO: Add interest-based segmentation options */}
        {/* TODO: Add preview of recent newsletter content */}
      </div>
    </aside>
  );
}
