/**
 * useGenuineCompletion — fires the completion ceremony for genuine reads only.
 *
 * Wraps useScrollDepth + completion-detector. A reader who scrolls to
 * the bottom in 3 seconds gets nothing — the ceremony rewards reading,
 * not skimming. Confidence ≥ 70% triggers the ceremony.
 *
 * One-shot: once fired, it stays true for the session.
 */

import { useState, useEffect, useRef } from 'react';
import { useScrollDepth } from './useScrollDepth';
import { detectCompletion, type DetectionResult } from '@/lib/detection/completion-detector';

interface GenuineCompletionState {
  isComplete: boolean;
  confidence: number;
}

export function useGenuineCompletion(readTimeMin: number): GenuineCompletionState {
  const { depth, isFinished, maxDepth } = useScrollDepth();
  const start = useRef(Date.now());
  const fired = useRef(false);
  const [result, setResult] = useState<GenuineCompletionState>({
    isComplete: false, confidence: 0,
  });

  useEffect(() => {
    if (!isFinished || fired.current) return;

    const dwell = (Date.now() - start.current) / 1000;
    const detection: DetectionResult = detectCompletion({
      scrollDepth: maxDepth,
      timeSpent: dwell,
      estimatedReadTime: readTimeMin,
      isFinished: true,
    });

    fired.current = true;
    setResult({
      isComplete: detection.isGenuineRead,
      confidence: detection.confidence,
    });
  }, [isFinished, maxDepth, readTimeMin]);

  return result;
}
