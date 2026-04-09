/**
 * useEvolution — reads snapshot history from localStorage, detects archetype shifts.
 *
 * Anonymous-first: no API call, no login. Each quickSynthesize result is
 * appended to a local ring buffer. If 2+ snapshots exist AND archetype
 * changed between oldest and newest, evolution data is returned.
 *
 */

'use client';

import { useState, useEffect } from 'react';
import type { ArchetypeKey } from '@/types/content';

// ── Types ──────────────────────────────────────────────────

export interface LocalSnapshot {
  archetype: ArchetypeKey;
  archetypeLabel: string;
  whisper: string;
  confidence: number;
  scores: { depth: number; breadth: number; consistency: number };
  timestamp: number;
  articleId: string;
}

export interface GoldenThread {
  visits: number;
  articles: number;
  days: number;
}

export interface EvolutionData {
  then: LocalSnapshot;
  now: LocalSnapshot;
  thread: GoldenThread;
}

// ── Constants ──────────────────────────────────────────────

const STORAGE_KEY = 'mirror_snapshots';
const MAX_ENTRIES = 10;

// ── Pure helpers ───────────────────────────────────────────

function loadSnapshots(): LocalSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function hasEvolved(snapshots: LocalSnapshot[]): boolean {
  if (snapshots.length < 2) return false;
  return snapshots[0].archetype !== snapshots[snapshots.length - 1].archetype;
}

function computeThread(snapshots: LocalSnapshot[]): GoldenThread {
  const ms = Date.now() - snapshots[0].timestamp;
  return {
    visits: snapshots.length,
    articles: new Set(snapshots.map(s => s.articleId)).size,
    days: Math.round(ms / 86400000),
  };
}

// ── Public: append a new snapshot ──────────────────────────

export function appendSnapshot(snap: LocalSnapshot): void {
  try {
    const all = loadSnapshots();
    const today = new Date().toDateString();
    // Throttle: 1 snapshot per day
    if (all.length > 0 && new Date(all[all.length - 1].timestamp).toDateString() === today) return;
    all.push(snap);
    // Ring buffer: keep last MAX_ENTRIES
    if (all.length > MAX_ENTRIES) all.splice(0, all.length - MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* localStorage full or unavailable */ }
}

// ── Hook ───────────────────────────────────────────────────

export function useEvolution() {
  const [evolution, setEvolution] = useState<EvolutionData | null>(null);

  useEffect(() => {
    const all = loadSnapshots();
    if (!hasEvolved(all)) { setEvolution(null); return; }
    setEvolution({
      then: all[0],
      now: all[all.length - 1],
      thread: computeThread(all),
    });
  }, []);

  return evolution;
}
