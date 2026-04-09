'use client';

import { useChallengeForm } from '@/lib/hooks/useChallengeForm';

interface ChallengeModalProps {
  articleId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChallengeModal({ articleId, isOpen, onClose }: ChallengeModalProps) {
  const { formData, errors, isSubmitting, updateField, submitChallenge } =
    useChallengeForm(onClose);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitChallenge(articleId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg p-6 max-w-lg w-full shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-primary">Challenge This Post</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.authorName}
              onChange={(e) => updateField('authorName', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.authorEmail}
              onChange={(e) => updateField('authorEmail', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Your Challenge</label>
            <textarea
              value={formData.challengeText}
              onChange={(e) => updateField('challengeText', e.target.value)}
              rows={5}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {errors.submit && (
            <p className="text-red-500 text-sm">{errors.submit}</p>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Challenge'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
