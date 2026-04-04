'use client';

import { useState } from 'react';
import { FEEDBACK_REASONS, type FeedbackReason, type FeedbackFormData } from '@/types/feedback';

interface ExitFeedbackModalProps {
  postId: string;
  timeOnPage: number;
  scrollDepth: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Exit-Intent Feedback Modal
 *
 * Appears when user shows intent to leave the page (mouse moves to top)
 * Collects feedback on why they're leaving to help improve content
 */
export function ExitFeedbackModal({
  postId,
  timeOnPage,
  scrollDepth,
  isOpen,
  onClose,
}: ExitFeedbackModalProps) {
  const [selectedReason, setSelectedReason] = useState<FeedbackReason | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          reason: selectedReason,
          comment: comment || undefined,
          timeOnPage: Math.floor(timeOnPage / 1000), // Convert to seconds
          scrollDepth: Math.round(scrollDepth),
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        console.error('Failed to submit feedback');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
          <p className="text-gray-300">
            Your feedback helps us improve our content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Quick question before you go...
          </h2>
          <p className="text-gray-300">
            We're always looking to improve. What's your main reason for leaving?
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {FEEDBACK_REASONS.map((reason) => (
            <button
              key={reason.value}
              onClick={() => setSelectedReason(reason.value)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedReason === reason.value
                  ? 'border-primary bg-primary bg-opacity-10'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-600'
              }`}
              disabled={isSubmitting}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{reason.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-white mb-1">
                    {reason.label}
                  </div>
                  <div className="text-sm text-gray-400">
                    {reason.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedReason === 'other' && (
          <div className="mb-6">
            <label
              htmlFor="feedback-comment"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Please tell us more (optional)
            </label>
            <textarea
              id="feedback-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What could we do better?"
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              disabled={isSubmitting}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {comment.length} / 500
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          This helps us create better content for you. No personal data is collected.
        </p>
      </div>
    </div>
  );
}
