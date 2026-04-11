/**
 * useQuickMirror — triggers archetype synthesis via dwell-gated scroll.
 *
 * Instead of firing at raw scroll depth, the reader must dwell at or beyond
 * the trigger depth for a minimum time (default 15s). Speed-scrollers get
 * nothing. Careful readers earn the reveal.
 *
 * Uses shouldReveal() from dwell-gate.ts (pure function, tested).
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
import { shouldReveal, QUICK_MIRROR_GATE } from '@/lib/thermal/dwell-gate';

const STORAGE_KEY = 'quick-mirror-result';

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
  triggerDepth: number = QUICK_MIRROR_GATE.triggerDepth
) {
  const { bag, getParagraphMap } = useBehavioralSignals({ articleId, estimatedReadTime });
  const startTime = useRef(Date.now());
  const depthReachedAt = useRef<number | null>(null);
  const [triggered, setTriggered] = useState(false);
  const [result, setResult] = useState<QuickMirrorResult | null>(loadCached);

  useEffect(() => {
    if (triggered) return;

    // Track when reader first reaches the trigger depth
    if (bag.depth >= triggerDepth && depthReachedAt.current === null) {
      depthReachedAt.current = Date.now();
    }

    // Compute dwell seconds at or beyond the trigger depth
    const dwellSecsAtDepth = depthReachedAt.current !== null
      ? (Date.now() - depthReachedAt.current) / 1000
      : 0;

    // Gate: both scroll depth AND dwell time must be met
    if (!shouldReveal({ scrollDepth: bag.depth, dwellSecsAtDepth, triggerDepth, minDwell: QUICK_MIRROR_GATE.minDwell })) return;

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
