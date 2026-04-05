'use client';

import { useState, useEffect } from 'react';
import { EnhancedProgressBar } from './EnhancedProgressBar';
import { MilestoneCard } from './MilestoneCard';
import { CommitmentNudges } from './CommitmentNudges';
import { InsightPreview } from './InsightPreview';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';

/**
 * ReadingCommitmentSystem - Complete reading engagement feature set
 *
 * This component integrates all Reading Commitment System features:
 * 1. InsightPreview - Shows what readers will learn
 * 2. EnhancedProgressBar - Progress with time remaining
 * 3. MilestoneCard - Shareable milestone celebrations
 * 4. CommitmentNudges - Strategic encouragement messages
 *
 * Design principles:
 * - Non-intrusive and respectful of reading experience
 * - Progressive enhancement (gracefully degrades)
 * - Performance-optimized (Intersection Observer)
 * - Accessible (ARIA labels, keyboard navigation)
 *
 * Based on Michael Koch's architecture plan:
 * - Simple, static implementation (no AI/ML)
 * - Clear user value: time transparency + milestone celebrations
 * - High shareability: drives word-of-mouth marketing
 *
 * // TODO: Add A/B testing for nudge timing
 * // TODO: Add analytics for milestone completion rates
 * // TODO: Add personalization based on reading history
 */

interface ReadingCommitmentSystemProps {
  articleId: string;
  articleTitle: string;
  readingTime: number;
  takeaways?: string[];
  keyConcepts?: string[];
  showInsightPreview?: boolean;
  showEnhancedProgress?: boolean;
  showMilestoneCard?: boolean;
  showNudges?: boolean;
}

export function ReadingCommitmentSystem({
  articleId,
  articleTitle,
  readingTime,
  takeaways = [],
  keyConcepts = [],
  showInsightPreview = true,
  showEnhancedProgress = true,
  showMilestoneCard = true,
  showNudges = true,
}: ReadingCommitmentSystemProps) {
  const { depth, isFinished } = useScrollDepth({ articleId });
  const [milestoneCardVisible, setMilestoneCardVisible] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<50 | 100 | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
  const [shownMilestones, setShownMilestones] = useState<Set<number>>(new Set());

  // Track reading time
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isFinished) {
        setTimeElapsed(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isFinished]);

  // Show milestone card at 50% and 100%
  useEffect(() => {
    const milestones = [50, 100];

    for (const milestone of milestones) {
      if (
        depth >= milestone &&
        !shownMilestones.has(milestone) &&
        showMilestoneCard
      ) {
        setCurrentMilestone(milestone as 50 | 100);
        setMilestoneCardVisible(true);
        setShownMilestones(prev => new Set([...prev, milestone]));

        // Auto-dismiss after 10 seconds
        const timer = setTimeout(() => {
          setMilestoneCardVisible(false);
        }, 10000);

        return () => clearTimeout(timer);
      }
    }
  }, [depth, shownMilestones, showMilestoneCard]);

  return (
    <>
      {/* 1. InsightPreview - What you'll learn */}
      {showInsightPreview && takeaways.length > 0 && (
        <InsightPreview
          readingTime={readingTime}
          takeaways={takeaways}
          keyConcepts={keyConcepts}
        />
      )}

      {/* 2. EnhancedProgressBar - Progress with time remaining */}
      {showEnhancedProgress && (
        <EnhancedProgressBar
          articleId={articleId}
          totalReadingTime={readingTime}
        />
      )}

      {/* 3. CommitmentNudges - Strategic encouragement */}
      {showNudges && (
        <CommitmentNudges
          articleId={articleId}
          readingTime={readingTime}
        />
      )}

      {/* 4. MilestoneCard - Shareable milestone celebrations */}
      {showMilestoneCard && currentMilestone && (
        <MilestoneCard
          milestone={currentMilestone}
          articleTitle={articleTitle}
          timeToComplete={Math.round(timeElapsed / 60)}
          isVisible={milestoneCardVisible}
          onDismiss={() => setMilestoneCardVisible(false)}
        />
      )}
    </>
  );
}

// TODO: Add reading streak tracking
// TODO: Add personal best records
// TODO: Add topic mastery indicators
