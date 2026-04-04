/**
 * useScrollDepth Hook - Track scroll progress through article
 *
 * Uses Intersection Observer API for optimal performance (no scroll event listeners).
 * Provides smooth, accurate reading depth measurement.
 *
 * Performance benefits:
 * - Browser-native Intersection Observer API
 * - No scroll event listeners (higher CPU usage)
 * - Throttled updates for smoothness
 * - Handles edge cases (short articles, dynamic content)
 *
 * Based on Michael Koch's architectural recommendation:
 * "Intersection Observer API: Why? Browser-native, performant"
 */

'use client';

import { useState, useEffect, useRef } from 'react';

interface UseScrollDepthProps {
  articleId: string;
  threshold?: number;
}

export function useScrollDepth({ articleId, threshold = 5 }: UseScrollDepthProps) {
  const [depth, setDepth] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const checkpointsRef = useRef<Map<Element, number>>(new Map());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const numCheckpoints = createCheckpoints(
      checkpointsRef,
      setDepth,
      setIsFinished
    );
    if (numCheckpoints === null) return;

    const handleIntersect = createIntersectionHandler(
      numCheckpoints,
      threshold,
      setDepth,
      setIsReading,
      setIsFinished,
      rafRef
    );

    const observer = createObserver(handleIntersect);
    observerRef.current = observer;

    observeCheckpoints(observer, checkpointsRef);
    return () => cleanup(observerRef, rafRef, checkpointsRef);
  }, [articleId, threshold]);

  return { depth, isReading, isFinished };
}

// Helper: Create checkpoint elements throughout the page
function createCheckpoints(
  checkpointsRef: React.MutableRefObject<Map<Element, number>>,
  setDepth: (depth: number) => void,
  setIsFinished: (finished: boolean) => void
): number | null {
  clearExistingCheckpoints(checkpointsRef);

  const { scrollableHeight, isShortArticle } = getScrollMetrics();
  if (isShortArticle) {
    setDepth(100);
    setIsFinished(true);
    return null;
  }

  return placeCheckpoints(scrollableHeight, checkpointsRef);
}

// Helper: Get scroll metrics
function getScrollMetrics() {
  const documentHeight = document.documentElement.scrollHeight;
  const viewportHeight = window.innerHeight;
  const scrollableHeight = documentHeight - viewportHeight;
  return { scrollableHeight, isShortArticle: scrollableHeight <= 0 };
}

// Helper: Clear existing checkpoints
function clearExistingCheckpoints(
  checkpointsRef: React.MutableRefObject<Map<Element, number>>
) {
  const checkpoints = checkpointsRef.current;
  checkpoints.forEach((_, element) => element.remove());
  checkpoints.clear();
}

// Helper: Place checkpoint elements
function placeCheckpoints(
  scrollableHeight: number,
  checkpointsRef: React.MutableRefObject<Map<Element, number>>
): number {
  const numCheckpoints = 20;
  const spacing = scrollableHeight / numCheckpoints;

  for (let i = 0; i <= numCheckpoints; i++) {
    const checkpoint = createCheckpoint(i, spacing);
    document.body.appendChild(checkpoint);
    checkpointsRef.current.set(checkpoint, i);
  }

  return numCheckpoints;
}

// Helper: Create single checkpoint element
function createCheckpoint(index: number, spacing: number): HTMLDivElement {
  const checkpoint = document.createElement('div');
  checkpoint.style.position = 'absolute';
  checkpoint.style.top = `${index * spacing}px`;
  checkpoint.style.width = '1px';
  checkpoint.style.height = '1px';
  checkpoint.style.pointerEvents = 'none';
  checkpoint.dataset.checkpointIndex = index.toString();
  return checkpoint;
}

// Helper: Create intersection handler
function createIntersectionHandler(
  numCheckpoints: number,
  threshold: number,
  setDepth: (depth: number) => void,
  setIsReading: (reading: boolean) => void,
  setIsFinished: (finished: boolean) => void,
  rafRef: React.MutableRefObject<number | null>
) {
  return (entries: IntersectionObserverEntry[]) => {
    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      const highestCheckpoint = findHighestCheckpoint(entries);
      updateProgress(highestCheckpoint, numCheckpoints, threshold, setDepth, setIsReading, setIsFinished);
      rafRef.current = null;
    });
  };
}

// Helper: Find highest visible checkpoint
function findHighestCheckpoint(entries: IntersectionObserverEntry[]): number {
  let highest = 0;
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const target = entry.target as HTMLElement;
      const index = parseInt(target.dataset.checkpointIndex || '0', 10);
      highest = Math.max(highest, index);
    }
  });
  return highest;
}

// Helper: Update progress state
function updateProgress(
  highestCheckpoint: number,
  numCheckpoints: number,
  threshold: number,
  setDepth: (depth: number) => void,
  setIsReading: (reading: boolean) => void,
  setIsFinished: (finished: boolean) => void
) {
  if (highestCheckpoint > 0) {
    const newDepth = (highestCheckpoint / numCheckpoints) * 100;
    setDepth(newDepth);
    setIsReading(newDepth >= threshold);
    setIsFinished(newDepth >= 98);
  }
}

// Helper: Create Intersection Observer
function createObserver(
  handleIntersect: IntersectionObserverCallback
): IntersectionObserver {
  return new IntersectionObserver(handleIntersect, {
    root: null,
    rootMargin: '0px',
    threshold: [0, 0.5, 1],
  });
}

// Helper: Observe all checkpoints
function observeCheckpoints(
  observer: IntersectionObserver,
  checkpointsRef: React.MutableRefObject<Map<Element, number>>
) {
  checkpointsRef.current.forEach((_, element) => {
    observer.observe(element);
  });
}

// Helper: Cleanup on unmount
function cleanup(
  observer: React.MutableRefObject<IntersectionObserver | null>,
  rafRef: React.MutableRefObject<number | null>,
  checkpointsRef: React.MutableRefObject<Map<Element, number>>
) {
  if (observer.current) observer.current.disconnect();
  if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  checkpointsRef.current.forEach((_, element) => element.remove());
  checkpointsRef.current.clear();
}
