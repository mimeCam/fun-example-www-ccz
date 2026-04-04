'use client';

import { useState, useEffect } from 'react';
import { createResonanceAction } from '@/app/actions/resonances';

interface ResonanceButtonProps {
  articleId: string;
  articleTitle: string;
  user_email?: string;
}

/**
 * ResonanceButton - Resonance-First Bookmarking
 *
 * Design Philosophy:
 * - Meaning over collection: Require articulation of WHY it matters
 * - 5-slot scarcity: Create intentional curation
 * - Vitality system: 30-day decay with visit resets
 * - Private by default: Personal reading sanctuary
 *
 * States:
 * 1. Default: Gem icon (💎)
 * 2. Click: Opens modal for mandatory resonance note
 * 3. Loading: Processing save
 * 4. Success: Article saved to active deck
 * 5. Error: Show error message
 */
export function ResonanceButton({
  articleId,
  articleTitle,
  user_email = ''
}: ResonanceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [resonanceNote, setResonanceNote] = useState('');
  const [quote, setQuote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // TODO: Check if user already has a resonance for this article
  // TODO: Fetch user's slot limits to show available slots
  // TODO: Track char count for resonance note (max 280)

  const handleSubmit = async () => {
    if (!user_email) {
      setError('Email is required to save resonances');
      return;
    }

    if (!resonanceNote.trim()) {
      setError('Please explain why this resonates with you');
      return;
    }

    if (resonanceNote.length > 280) {
      setError('Resonance note must be 280 characters or less');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createResonanceAction(
        user_email,
        articleId,
        resonanceNote.trim(),
        quote.trim() || undefined
      );

      if (result.success && result.resonance) {
        setSuccess(true);
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setError(result.error || 'Failed to save resonance');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error creating resonance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setResonanceNote('');
    setQuote('');
    setError(null);
    setSuccess(false);
  };

  const charCount = resonanceNote.length;
  const charCountColor = charCount > 250 ? 'text-amber-400' : 'text-gray-400';

  return (
    <>
      {/* Resonance Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="p-2 rounded-full text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all duration-300"
          aria-label="Save resonance"
        >
          {/* Gem Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 3h12l4 6-10 13L2 9z" />
            <path d="M12 3l4 6-4 13-4-13z" />
          </svg>
        </button>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-gray-900/90 text-white text-xs rounded-lg whitespace-nowrap animate-fade-in z-50">
            Save resonance
          </div>
        )}
      </div>

      {/* Resonance Capture Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="relative bg-gray-900 border border-gray-800 rounded-lg max-w-lg w-full p-6 shadow-2xl animate-fade-in">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                Save Resonance 💎
              </h3>
              <p className="text-gray-400 text-sm">
                Why does this article resonate with you?
              </p>
            </div>

            {/* Success Message */}
            {success ? (
              <div className="py-8 text-center">
                <div className="text-4xl mb-4">✨</div>
                <p className="text-green-400 text-lg font-medium">
                  Resonance saved!
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Added to your active deck
                </p>
              </div>
            ) : (
              <>
                {/* Resonance Note Input */}
                <div className="mb-4">
                  <label
                    htmlFor="resonanceNote"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Your resonance note <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="resonanceNote"
                    value={resonanceNote}
                    onChange={(e) => setResonanceNote(e.target.value)}
                    placeholder="What insight or perspective resonated with you? Why does this matter to you?"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                    rows={4}
                    maxLength={280}
                    disabled={isLoading}
                  />
                  <div className="flex justify-between mt-1">
                    <span className={`text-xs ${charCountColor}`}>
                      {charCount}/280 characters
                    </span>
                    {charCount < 10 && resonanceNote.length > 0 && (
                      <span className="text-xs text-amber-400">
                        Too short
                      </span>
                    )}
                  </div>
                </div>

                {/* Optional Quote Capture */}
                <div className="mb-6">
                  <label
                    htmlFor="quote"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Capture a quote <span className="text-gray-500">(optional)</span>
                  </label>
                  <textarea
                    id="quote"
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="Highlight a meaningful passage..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                    rows={2}
                    maxLength={500}
                    disabled={isLoading}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !resonanceNote.trim()}
                    className="flex-1 px-4 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isLoading ? 'Saving...' : 'Save Resonance'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// TODO: Add slot limit indicator to modal
// TODO: Add existing resonance check and show "View Resonance" instead
// TODO: Add progressive unlock messaging when slots are full
// TODO: Implement quote capture from text selection
