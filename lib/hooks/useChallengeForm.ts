import { useState } from 'react';

interface UseChallengeFormResult {
  formData: {
    authorName: string;
    authorEmail: string;
    challengeText: string;
  };
  errors: Record<string, string>;
  isSubmitting: boolean;
  updateField: (field: string, value: string) => void;
  submitChallenge: (articleId: string) => Promise<void>;
  resetForm: () => void;
}

export function useChallengeForm(
  onSuccess: () => void
): UseChallengeFormResult {
  const [formData, setFormData] = useState({
    authorName: '',
    authorEmail: '',
    challengeText: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear errors when user types
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const submitChallenge = async (articleId: string) => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, articleId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit challenge');
      }

      resetForm();
      onSuccess();
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ authorName: '', authorEmail: '', challengeText: '' });
    setErrors({});
  };

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    submitChallenge,
    resetForm,
  };
}

