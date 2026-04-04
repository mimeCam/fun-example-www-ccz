/**
 * useMilestones Hook - Track reading milestones (50%, 100%)
 *
 * Uses scroll depth tracking to detect when user reaches key milestones:
 * - 50%: Psychological momentum point
 * - 100%: Article completion
 *
 * Features:
 * - Respects previously reached milestones (from localStorage)
 * - Prevents duplicate triggers for same session
 * - Provides callbacks for milestone events
 * - Integrates with existing useScrollDepth hook
 *
 * Based on team spec:
 * - Achievement framing (not commitment)
 * - Positive reinforcement messages
 * - Persistent tracking across sessions
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useScrollDepth } from './useScrollDepth';
import {
  hasReachedMilestone,
  hasMilestoneProgress,
  markMilestoneReached,
  getMilestoneMessage,
  getMilestoneDescription,
  type Milestone,
} from '@/lib/utils/milestoneUtils';

interface UseMilestonesProps {
  articleId: string;
  onMilestoneReached?: (milestone: Milestone, message: string, description: string) => void;
}

interface MilestoneState {
  currentMilestone: Milestone | null;
  message: string;
  description: string;
  isVisible: boolean;
}

export function useMilestones({ articleId, onMilestoneReached }: UseMilestonesProps) {
  const { depth } = useScrollDepth({ articleId });
  const [milestoneState, setMilestoneState] = useState<MilestoneState>({
    currentMilestone: null,
    message: '',
    description: '',
    isVisible: false,
  });

  // Track which milestones have been triggered this session
  const triggeredMilestones = useRef<Set<Milestone>>(new Set());

  // Track previously reached milestones from storage
  const previousMilestones = useRef<Set<Milestone>>(new Set());

  // Initialize: load previously reached milestones
  useEffect(() => {
    const loadPreviousMilestones = () => {
      const previous: Set<Milestone> = new Set();
      [50, 100].forEach((milestone) => {
        if (hasReachedMilestone(articleId, milestone as Milestone)) {
          previous.add(milestone as Milestone);
        }
      });
      previousMilestones.current = previous;
    };

    loadPreviousMilestones();
  }, [articleId]);

  // Monitor scroll depth for milestones
  useEffect(() => {
    const milestonesToCheck: Milestone[] = [50, 100];

    for (const milestone of milestonesToCheck) {
      // Check if milestone progress is reached
      if (hasMilestoneProgress(depth, milestone)) {
        // Check if NOT already triggered this session
        if (!triggeredMilestones.current.has(milestone)) {
          // Mark as triggered this session
          triggeredMilestones.current.add(milestone);

          // Mark as reached in localStorage
          markMilestoneReached(articleId, milestone);

          // Get milestone messages
          const message = getMilestoneMessage(milestone);
          const description = getMilestoneDescription(milestone);

          // Update state
          setMilestoneState({
            currentMilestone: milestone,
            message,
            description,
            isVisible: true,
          });

          // Trigger callback
          if (onMilestoneReached) {
            onMilestoneReached(milestone, message, description);
          }
        }
      }
    }
  }, [depth, articleId, onMilestoneReached]);

  // Dismiss milestone notification
  const dismissMilestone = () => {
    setMilestoneState((prev) => ({ ...prev, isVisible: false }));
  };

  return {
    milestoneState,
    dismissMilestone,
    hasCompletedArticle: previousMilestones.current.has(100),
  };
}

// TODO: Add milestone analytics tracking
// TODO: Add social proof count fetching
// TODO: Add milestone celebration effects configuration
