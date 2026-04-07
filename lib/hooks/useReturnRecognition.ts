/**
 * useReturnRecognition — detects returning readers from localStorage.
 *
 * Reads quick-mirror-result, mirror_snapshots, and reading_memory
 * to compute recognition tier, archetype, and days since last visit.
 * SSR-safe via useState + useEffect (mount-time detection).
 *
 * No API, no DB — pure client-side.
 */

'use client';

import { useState, useEffect } from 'react';
import type { ArchetypeKey } from '@/types/content';
import type { SeasonKey } from '@/types/book-narration';
import { synthesizeReturnWhisper } from '@/lib/mirror/return-whisper-engine';
import { getSeason } from '@/lib/mirror/season-engine';

export type RecognitionTier = 'stranger' | 'returning' | 'known';

export interface ReturnRecognitionState {
  isReturning: boolean;
  archetype: ArchetypeKey | null;
  daysSinceLastVisit: number | null;
  visitCount: number;
  recognitionTier: RecognitionTier;
  lastWhisper: string | null;
}

// ─── SSR-safe localStorage readers ───────────────────────

function readQuickMirrorArchetype(): ArchetypeKey | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('quick-mirror-result');
    return raw ? JSON.parse(raw).archetype : null;
  } catch { return null; }
}

function readLatestSnapshotTimestamp(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('mirror_snapshots');
    const arr = raw ? JSON.parse(raw) : [];
    return arr.length > 0 ? arr[arr.length - 1].timestamp : null;
  } catch { return null; }
}

function countReadingMemory(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem('reading_memory');
    return raw ? Object.keys(JSON.parse(raw)).length : 0;
  } catch { return 0; }
}

// ─── Tier resolution ─────────────────────────────────────

function resolveTier(
  archetype: ArchetypeKey | null,
  visitCount: number,
  hasSnapshots: boolean
): RecognitionTier {
  if (!archetype && visitCount === 0) return 'stranger';
  if (archetype && hasSnapshots) return 'known';
  if (visitCount >= 2) return 'returning';
  return 'stranger';
}

// ─── Hook ────────────────────────────────────────────────

const INITIAL: ReturnRecognitionState = {
  isReturning: false,
  archetype: null,
  daysSinceLastVisit: null,
  visitCount: 0,
  recognitionTier: 'stranger',
  lastWhisper: null,
};

export function useReturnRecognition(): ReturnRecognitionState {
  const [state, setState] = useState<ReturnRecognitionState>(INITIAL);

  useEffect(() => {
    const archetype = readQuickMirrorArchetype();
    const lastTs = readLatestSnapshotTimestamp();
    const visitCount = countReadingMemory();
    const hasSnapshots = lastTs !== null;

    const tier = resolveTier(archetype, visitCount, hasSnapshots);
    const isReturning = tier !== 'stranger';

    const daysSince = lastTs
      ? Math.floor((Date.now() - lastTs) / 86400000)
      : null;

    let lastWhisper: string | null = null;
    if (isReturning && archetype) {
      const season = getSeason(new Date()).key as SeasonKey;
      lastWhisper = synthesizeReturnWhisper({
        archetype,
        daysSinceLastVisit: daysSince ?? 0,
        season,
        visitCount,
      });
    }

    setState({ isReturning, archetype, daysSinceLastVisit: daysSince, visitCount, recognitionTier: tier, lastWhisper });
  }, []);

  return state;
}
