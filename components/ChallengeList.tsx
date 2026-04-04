'use client';

import { useEffect, useState } from 'react';
import type { Challenge } from '@/types/challenge';

interface ChallengeListProps {
  articleId: string;
}

export function ChallengeList({ articleId }: ChallengeListProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchChallenges() {
      try {
        const response = await fetch(`/api/challenge/article/${articleId}`);
        if (!response.ok) throw new Error('Failed to fetch challenges');

        const data: Challenge[] = await response.json();
        // Only show approved challenges
        const approvedChallenges = data.filter(c => c.status === 'approved');
        setChallenges(approvedChallenges);
      } catch (error) {
        console.warn('Failed to load challenges:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchChallenges();
  }, [articleId]);

  if (isLoading) {
    return (
      <div className="border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-primary">Challenges</h3>
        <p className="text-sm text-gray-400">Loading challenges...</p>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-primary">Challenges</h3>
        <p className="text-sm text-gray-400">No challenges yet. Be the first to challenge this post!</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-primary">
        Challenges ({challenges.length})
      </h3>
      <div className="space-y-4">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="border-b border-gray-700 pb-4 last:border-0 last:pb-0"
          >
            <p className="text-sm text-gray-300 mb-2">{challenge.challengeText}</p>
            <p className="text-xs text-gray-500">
              {challenge.authorName} • {new Date(challenge.createdAt).toLocaleDateString()}
            </p>
            {/* TODO: Add voting/reaction buttons for challenges */}
            {/* TODO: Add "view challenge thread" link for replies */}
          </div>
        ))}
      </div>
    </div>
  );
}
