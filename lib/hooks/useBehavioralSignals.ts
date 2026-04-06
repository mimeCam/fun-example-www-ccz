/**
 * useBehavioralSignals — enriches scroll depth with behavioral metrics.
 *
 * Reads depth from ScrollDepthProvider (shared context).
 * Adds velocity tracking, re-read detection, dwell time, and pace ratio.
 * No new observers — pure derivation from the single shared scroll source.
 *
 * Returns BehavioralSignalBag for the enhanced scoring engine.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useScrollDepth } from './useScrollDepth';

export interface BehavioralSignalBag {
  depth: number;       // 0–100 from shared context
  velocity: number;    // smoothed depth pts/sec (EMA)
  reReadCount: number; // times depth dropped after a new max
  dwellSecs: number;   // seconds since mount
  pace: number;        // dwellSecs / (estimatedReadTime × 60)
  maxDepth: number;    // peak depth reached
  // Paragraph-level signals (optional — enriched when paragraph tracking active)
  deepReadRatio?: number;      // 0-1: fraction of paragraphs deeply read
  engagementVariance?: number; // 0-1: normalized dwell variance across paragraphs
  peakParagraphCount?: number; // count of paragraphs with dwell > 2× avg
  skipRatio?: number;          // 0-1: fraction of paragraphs skipped
}

function emptyBag(): BehavioralSignalBag {
  return { depth: 0, velocity: 0, reReadCount: 0, dwellSecs: 0, pace: 0, maxDepth: 0 };
}

const REREAD_THRESHOLD = 5;
const ALPHA = 0.4; // EMA smoothing factor

interface Props {
  articleId: string;
  estimatedReadTime: number;
}

export function useBehavioralSignals({ articleId, estimatedReadTime }: Props) {
  const { depth, maxDepth } = useScrollDepth();
  const t0 = useRef(Date.now());
  const prevDepth = useRef(0);
  const prevTime = useRef(Date.now());
  const reReads = useRef(0);
  const vel = useRef(0);
  const [bag, setBag] = useState<BehavioralSignalBag>(emptyBag);

  useEffect(() => {
    const now = Date.now();
    const dt = (now - prevTime.current) / 1000;
    const instant = dt > 0 ? (depth - prevDepth.current) / dt : 0;
    vel.current = ALPHA * instant + (1 - ALPHA) * vel.current;

    if (depth < maxDepth - REREAD_THRESHOLD) reReads.current += 1;

    prevDepth.current = depth;
    prevTime.current = now;

    const dwellSecs = (now - t0.current) / 1000;
    const pace = estimatedReadTime > 0 ? dwellSecs / (estimatedReadTime * 60) : 1;

    setBag({ depth, velocity: vel.current, reReadCount: reReads.current, dwellSecs, pace, maxDepth });
  }, [depth, estimatedReadTime, maxDepth]);

  return bag;
}
