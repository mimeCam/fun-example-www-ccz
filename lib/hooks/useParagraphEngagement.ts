/**
 * useParagraphEngagement — tracks per-paragraph reader engagement.
 *
 * Observes all elements with `data-paragraph-id` in the article body.
 * Records dwell time, visit count, deep-read flag, and skip detection
 * for each paragraph — all in refs (zero re-renders during tracking).
 *
 * Call getSummary() at Mirror trigger time to derive the 4 paragraph signals
 * (deepReadRatio, engagementVariance, peakParagraphCount, skipRatio)
 * that feed into enhancedScoring().
 *
 * No new global observers — uses its own IntersectionObserver scoped to
 * paragraph elements. Cleaned up on unmount.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { ParagraphEngagementMap, ParagraphEngagementSummary } from '@/types/content';
import { summarizeParagraphEngagement } from '@/lib/mirror/enhanced-scoring';

const DEEP_READ_MS = 3000;
const SKIP_MS = 500;
const SELECTOR = '[data-paragraph-id]';

interface EntryState {
  enterTime: number | null;
  dwellMs: number;
  visits: number;
}

export function useParagraphEngagement() {
  const mapRef = useRef<ParagraphEngagementMap>({});
  const entriesRef = useRef<Record<string, EntryState>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const paragraphs = document.querySelectorAll(SELECTOR);
    if (paragraphs.length === 0) return;

    initEntries(paragraphs);
    observerRef.current = createObserver(paragraphs);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observerRef.current?.disconnect();
    };
  }, []);

  function initEntries(paragraphs: NodeListOf<Element>) {
    paragraphs.forEach(el => {
      const id = el.getAttribute('data-paragraph-id')!;
      entriesRef.current[id] = { enterTime: null, dwellMs: 0, visits: 0 };
    });
  }

  function createObserver(paragraphs: NodeListOf<Element>) {
    const obs = new IntersectionObserver(
      (entries) => {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => processEntries(entries));
      },
      { threshold: [0, 0.5, 1.0] }
    );
    paragraphs.forEach(el => obs.observe(el));
    return obs;
  }

  function processEntries(entries: IntersectionObserverEntry[]) {
    const now = Date.now();
    entries.forEach(entry => processOneEntry(entry, now));
    syncMap();
  }

  function processOneEntry(entry: IntersectionObserverEntry, now: number) {
    const id = entry.target.getAttribute('data-paragraph-id');
    if (!id) return;

    const state = entriesRef.current[id];
    if (!state) return;

    if (entry.isIntersecting) {
      handleEnter(state, now);
    } else if (state.enterTime !== null) {
      handleExit(state, now);
    }
  }

  function handleEnter(state: EntryState, now: number) {
    state.enterTime = now;
    state.visits += 1;
  }

  function handleExit(state: EntryState, now: number) {
    state.dwellMs += now - state.enterTime!;
    state.enterTime = null;
  }

  function syncMap() {
    Object.entries(entriesRef.current).forEach(([id, state]) => {
      mapRef.current[id] = {
        paragraphId: id,
        dwellMs: state.dwellMs,
        visits: state.visits,
        isDeepRead: state.dwellMs >= DEEP_READ_MS,
        skipped: state.visits === 0 || state.dwellMs < SKIP_MS,
      };
    });
  }

  const getSummary = useCallback((): ParagraphEngagementSummary => {
    return summarizeParagraphEngagement(mapRef.current);
  }, []);

  const getEngagementMap = useCallback((): ParagraphEngagementMap => {
    return { ...mapRef.current };
  }, []);

  return { getSummary, getEngagementMap };
}
