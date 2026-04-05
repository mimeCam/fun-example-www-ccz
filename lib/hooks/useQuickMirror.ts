/**
 * useQuickMirror — triggers lightweight archetype synthesis at scroll threshold.
 *
 * Watches scroll depth via useScrollDepth. At 70% (configurable), runs
 * quickSynthesize() and persists the result to localStorage.
 * No API call, no DB — pure client-side.
 *
 * // TODO: Extract scroll depth to a shared context to avoid duplicate observers
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useScrollDepth } from './useScrollDepth';
import {
  quickSynthesize,
  type QuickMirrorInput,
  type QuickMirrorResult,
} from '@/lib/mirror/quick-synthesize';

const STORAGE_KEY = 'quick-mirror-result';
const DEFAULT_TRIGGER = 70;

function loadCached(): QuickMirrorResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function persist(result: QuickMirrorResult): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(result)); }
  catch { /* ephemeral fallback — quick mirror is session-only */ }
}

export function useQuickMirror(
  articleId: string,
  estimatedReadTime: number,
  articleTopics: string[],
  triggerDepth: number = DEFAULT_TRIGGER
) {
  const { depth } = useScrollDepth({ articleId });
  const startTime = useRef(Date.now());
  const [triggered, setTriggered] = useState(false);
  const [result, setResult] = useState<QuickMirrorResult | null>(loadCached);

  useEffect(() => {
    if (triggered || depth < triggerDepth) return;

    const input: QuickMirrorInput = {
      scrollDepth: depth,
      timeOnPage: (Date.now() - startTime.current) / 1000,
      estimatedReadTime,
      articleTopics,
    };

    const synthesized = quickSynthesize(input);
    setResult(synthesized);
    setTriggered(true);
    persist(synthesized);
  }, [depth, triggered, triggerDepth, estimatedReadTime, articleTopics]);

  const dismiss = () => setTriggered(false);

  return { triggered, result, dismiss };
}
