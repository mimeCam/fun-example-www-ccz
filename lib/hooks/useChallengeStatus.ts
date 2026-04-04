import { useState, useEffect } from 'react';

interface UseChallengeStatusProps {
  articleId: string;
}

export function useChallengeStatus({ articleId }: UseChallengeStatusProps) {
  const [hasSubmittedChallenge, setHasSubmittedChallenge] = useState(false);
  const [challengeCount, setChallengeCount] = useState(0);

  useEffect(() => {
    // Check if user has submitted a challenge for this article
    const key = `challenge_submitted_${articleId}`;
    const hasSubmitted = localStorage.getItem(key) === 'true';
    setHasSubmittedChallenge(hasSubmitted);

    // Fetch challenge count
    async function fetchChallengeCount() {
      try {
        const response = await fetch(`/api/challenge/article/${articleId}`);
        if (response.ok) {
          const challenges = await response.json();
          const approvedCount = challenges.filter((c: any) => c.status === 'approved').length;
          setChallengeCount(approvedCount);
        }
      } catch (error) {
        console.warn('Failed to fetch challenge count:', error);
      }
    }

    fetchChallengeCount();
  }, [articleId]);

  const markChallengeSubmitted = () => {
    const key = `challenge_submitted_${articleId}`;
    localStorage.setItem(key, 'true');
    setHasSubmittedChallenge(true);
    setChallengeCount(prev => prev + 1);
  };

  return {
    hasSubmittedChallenge,
    challengeCount,
    markChallengeSubmitted,
  };
}
