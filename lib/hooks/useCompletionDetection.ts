/**
 * useCompletionDetection Hook - Detect genuine article completion
 *
 * Combines useTimeInvestment and useScrollDepth to determine if reader
 * genuinely completed the article (not just skimmed).
 *
 * Returns detection result when user finishes article.
 *
 */

'use client';

import { useEffect, useState } from 'react';
import { useTimeInvestment } from './useTimeInvestment';
import { useScrollDepth } from './useScrollDepth';
import { detectCompletion, type DetectionResult, type DetectionThresholds } from '@/lib/detection/completion-detector';

interface UseCompletionDetectionProps {
  articleId: string;
  estimatedReadTime?: number;
  thresholds?: DetectionThresholds;
  onDetect?: (result: DetectionResult) => void;
}

export function useCompletionDetection({
  articleId,
  estimatedReadTime = 5,
  thresholds,
  onDetect,
}: UseCompletionDetectionProps) {
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  const { timeSpent, formattedTime, isFirstVisit } = useTimeInvestment({
    articleId,
    estimatedReadTime,
  });

  const { depth, isReading, isFinished } = useScrollDepth();

  useEffect(() => {
    // Only detect when user finishes article
    if (!isFinished || hasTriggered) return;

    const detection = detectCompletion(
      {
        scrollDepth: depth,
        timeSpent,
        estimatedReadTime,
        isFinished,
      },
      thresholds
    );

    setResult(detection);
    setHasTriggered(true);

    // Trigger callback (for celebration UI, analytics, etc.)
    if (onDetect && detection.isGenuineRead) {
      onDetect(detection);
    }

  }, [isFinished, depth, timeSpent, estimatedReadTime, thresholds, hasTriggered, onDetect]);

  return {
    result,
    depth,
    timeSpent,
    formattedTime,
    isReading,
    isFinished,
    isFirstVisit,
  };
}
