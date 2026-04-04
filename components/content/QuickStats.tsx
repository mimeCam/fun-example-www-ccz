'use client';

import { useEffect, useState } from 'react';

interface QuickStatsProps {
  articleId: string;
  timeInvested: string;
  estimatedTime: number;
  hasChallenged: boolean;
  challengeCount: number;
}

interface Stats {
  notesCount: number;
}

export function QuickStats({
  articleId,
  timeInvested,
  estimatedTime,
  hasChallenged,
  challengeCount,
}: QuickStatsProps) {
  const [stats, setStats] = useState<Stats>({ notesCount: 0 });

  useEffect(() => {
    // Load notes count from localStorage
    const notesKey = `notes_${articleId}`;
    const savedNotes = localStorage.getItem(notesKey);
    const notes = savedNotes ? JSON.parse(savedNotes) : [];
    setStats({ notesCount: notes.length });
  }, [articleId]);

  const getInsight = (): string => {
    if (stats.notesCount > 0) {
      return 'Active engagement';
    }
    if (hasChallenged) {
      return 'Critical thinker';
    }
    if (challengeCount > 0) {
      return 'Popular discussion';
    }
    return 'Just getting started';
  };

  return (
    <div className="bg-surface border border-surface rounded-lg p-4 mb-6">
      <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-4">
        Your Progress
      </h3>

      <div className="space-y-3">
        {/* Time Investment */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Time invested</span>
          <span className="text-white font-medium">{timeInvested}</span>
        </div>

        {/* Estimated Time */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Estimated</span>
          <span className="text-gray-300">{estimatedTime} min</span>
        </div>

        {/* Notes Count */}
        {stats.notesCount > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Notes taken</span>
            <span className="text-primary font-medium">{stats.notesCount}</span>
          </div>
        )}

        {/* Challenge Status */}
        {hasChallenged && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Challenged</span>
            <span className="text-green-400">✓</span>
          </div>
        )}

        {/* Community Challenges */}
        {challengeCount > 0 && !hasChallenged && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Challenges</span>
            <span className="text-primary font-medium">{challengeCount}</span>
          </div>
        )}

        {/* Insight Message */}
        <div className="pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-500 italic">
            {getInsight()}
          </p>
        </div>
      </div>
    </div>
  );
}
