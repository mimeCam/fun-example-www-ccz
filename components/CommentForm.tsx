'use client';

import { useState } from 'react';
import type { Comment } from '@/types/comment';

interface CommentFormProps {
  articleId: string;
  parentId?: number;
  onSubmitSuccess?: (comment: Comment) => void;
  onCancel?: () => void;
}

export function CommentForm({
  articleId,
  parentId,
  onSubmitSuccess,
  onCancel,
}: CommentFormProps) {
  const [formData, setFormData] = useState({
    authorName: '',
    authorEmail: '',
    content: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wordCount = formData.content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const minWords = 100;
  const maxChars = 5000;

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.authorName.length < 2) {
      newErrors.authorName = 'Name must be at least 2 characters';
    }
    if (formData.authorName.length > 100) {
      newErrors.authorName = 'Name must not exceed 100 characters';
    }
    if (!formData.authorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.authorEmail)) {
      newErrors.authorEmail = 'Please enter a valid email address';
    }
    if (wordCount < minWords) {
      newErrors.content = `Comment must be at least ${minWords} words (current: ${wordCount})`;
    }
    if (formData.content.length > maxChars) {
      newErrors.content = `Comment must not exceed ${maxChars} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId,
          authorName: formData.authorName,
          authorEmail: formData.authorEmail,
          content: formData.content,
          parentId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit comment');
      }

      const comment: Comment = await response.json();
      onSubmitSuccess?.(comment);

      // Reset form
      setFormData({
        authorName: '',
        authorEmail: '',
        content: '',
      });
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-primary">
        {parentId ? 'Write a Reply' : 'Join the Conversation'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.authorName}
              onChange={(e) => updateField('authorName', e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {errors.authorName && (
              <p className="text-red-500 text-sm mt-1">{errors.authorName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.authorEmail}
              onChange={(e) => updateField('authorEmail', e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {errors.authorEmail && (
              <p className="text-red-500 text-sm mt-1">{errors.authorEmail}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Your Thoughts ({wordCount}/{minWords} words)
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => updateField('content', e.target.value)}
            rows={10}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Share your thoughtful perspective... (minimum 100 words)"
            required
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-gray-400">
              {formData.content.length}/{maxChars} characters
            </p>
            {wordCount < minWords && (
              <p className="text-sm text-yellow-500">
                {minWords - wordCount} more words needed
              </p>
            )}
          </div>
          {errors.content && (
            <p className="text-red-500 text-sm mt-1">{errors.content}</p>
          )}
        </div>

        {errors.submit && (
          <p className="text-red-500 text-sm">{errors.submit}</p>
        )}

        <div className="flex gap-3 justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || wordCount < minWords}
            className="px-6 py-2 bg-primary text-white rounded hover:bg-opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}
