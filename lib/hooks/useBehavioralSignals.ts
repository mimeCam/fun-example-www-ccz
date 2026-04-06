/**
 * useBehavioralSignals — enriches scroll depth with behavioral metrics.
 *
 * Wraps useScrollDepth. Adds velocity tracking (depth delta / time delta),
 * re-read detection (depth decreases after new max), dwell time (elapsed
 * since mount), and derived pace ratio. Zero new observers or deps.
 *
 * Returns BehavioralSignalBag for the enhanced scoring engine.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useScrollDepth } from './useScrollDepth';

export interface BehavioralSignalBag {
  depth: number;       // 0–100 from useScrollDepth
  velocity: number;    // smoothed depth pts/sec (EMA)
  reReadCount: number; // times depth decreased after new max
  dwellSecs: number;   // seconds since mount
  pace: number;        // dwellSecs / (estimatedReadTime * 60)
  maxDepth: number;    // peak depth reached
}

function emptyBag(): BehavioralSignalBag {
  return { depth: 0, velocity: 0, reReadCount: 0, dwellSecs: 0, pace: 0, maxDepth: 0 };
}

const REREAD_THRESHOLD = 5;
const SMOOTH_FACTOR = 0.4;

interface Props {
  articleId: string;
  estimatedReadTime: number;
}

export function useBehavioralSignals({ articleId, estimatedReadTime }: Props) {
  const { depth } = useScrollDepth({ articleId });
  const mountTime = useRef(Date.now());
  const prevDepth = useRef(0);
  const prevTime = useRef(Date.now());
  const maxReached = useRef(0);
  const reReads = useRef(0);
  const smoothVel = useRef(0);
  const [bag, setBag] = useState<BehavioralSignalBag>(emptyBag);

  useEffect(() => {
    const now = Date.now();
    const dt = (now - prevTime.current) / 1000;
    const instantVel = dt > 0 ? (depth - prevDepth.current) / dt : 0;
    smoothVel.current = SMOOTH_FACTOR * instantVel + (1 - SMOOTH_FACTOR) * smoothVel.current;

    if (depth < maxReached.current - REREAD_THRESHOLD) reReads.current += 1;
    if (depth > maxReached.current) maxReached.current = depth;

    prevDepth.current = depth;
    prevTime.current = now;

    const dwellSecs = (now - mountTime.current) / 1000;
    const pace = estimatedReadTime > 0 ? dwellSecs / (estimatedReadTime * 60) : 1;

    setBag({
      depth,
      velocity: smoothVel.current,
      reReadCount: reReads.current,
      dwellSecs,
      pace,
      maxDepth: maxReached.current,
    });
  }, [depth, estimatedReadTime]);

  return bag;
}
