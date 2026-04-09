/**
 * useQuickMirror — triggers lightweight archetype synthesis at scroll threshold.
 *
 * Watches behavioral signals via useBehavioralSignals. At 30% (configurable),
 * runs quickSynthesize() with enriched signal bag and persists to localStorage.
 * No API call, no DB — pure client-side.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useBehavioralSignals } from './useBehavioralSignals';
import {
  quickSynthesize,
  type QuickMirrorInput,
  type QuickMirrorResult,
} from '@/lib/mirror/quick-synthesize';
import { appendSnapshot } from './useEvolution';

const STORAGE_KEY = 'quick-mirror-result';
const DEFAULT_TRIGGER = 30;

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
  const { bag, getParagraphMap } = useBehavioralSignals({ articleId, estimatedReadTime });
  const startTime = useRef(Date.now());
  const [triggered, setTriggered] = useState(false);
  const [result, setResult] = useState<QuickMirrorResult | null>(loadCached);

  useEffect(() => {
    if (triggered || bag.depth < triggerDepth) return;

    const input: QuickMirrorInput = {
      scrollDepth: bag.depth,
      timeOnPage: (Date.now() - startTime.current) / 1000,
      estimatedReadTime,
      articleTopics,
      signalBag: bag,
      paragraphMap: getParagraphMap(),
    };

    const synthesized = quickSynthesize(input);
    setResult(synthesized);
    setTriggered(true);
    persist(synthesized);
    // Persist snapshot for Evolution Card (anonymous, localStorage)
    appendSnapshot({
      archetype: synthesized.archetype,
      archetypeLabel: synthesized.archetypeLabel,
      whisper: synthesized.whisper,
      confidence: synthesized.confidence,
      scores: synthesized.scores,
      timestamp: Date.now(),
      articleId,
    });
  }, [bag, triggered, triggerDepth, estimatedReadTime, articleTopics]);

  const dismiss = () => setTriggered(false);

  return { triggered, result, dismiss };
}
