/**
 * ThermalProvider — React Context distributing thermal state to the component tree.
 *
 * On mount: reuses inline script's CSS vars if present (no cold flash).
 * Ongoing: refreshes tokens from localStorage when reading activity changes.
 * Provides { score, state, tokens, animation, refresh } to consumers.
 */

'use client';

import {
  createContext, useContext, useState, useEffect, useCallback,
  useMemo, type ReactNode,
} from 'react';
import { type ThermalState, type ThermalResult } from '@/lib/thermal/thermal-score';
import { type ThermalTokens } from '@/lib/thermal/thermal-tokens';
import { type AnimationTokens } from '@/lib/thermal/thermal-animation';
import { computeFull, applyToDOM, type AppliedThermal } from '@/lib/thermal/apply-tokens';
import { ceremonyPlan, type TransitionPlan } from '@/lib/thermal/transition-choreography';
import type { ArchetypeKey } from '@/types/content';

interface ThermalContextValue {
  score: number;
  state: ThermalState;
  confidence: number;
  tokens: ThermalTokens;
  animation: AnimationTokens;
  isEngaged: boolean;
  /**
   * Mirror archetype, hydrated from localStorage on mount. `null` until the
   * reader has taken the Mirror, or when SSR/JS-disabled. Consumed by the
   * `<Toast>` voice contract via `useToast()` (Tanya §7.3 Option A).
   */
  archetype: ArchetypeKey | null;
  refresh: (plan?: TransitionPlan) => void;
}

/** localStorage key the Mirror writes archetype results to. */
const MIRROR_STORAGE_KEY = 'quick-mirror-result';

/** Pure read of the stored archetype, SSR-safe. */
function readStoredArchetype(): ArchetypeKey | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(MIRROR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { archetype?: ArchetypeKey };
    return parsed?.archetype ?? null;
  } catch { return null; }
}

const FALLBACK_ANIMATION: AnimationTokens = {
  '--token-breath-speed': '0', '--token-breath-scale': '0',
  '--token-glow-speed': '0', '--token-glow-min': '0', '--token-glow-max': '0',
  '--token-drift-speed': '0', '--token-drift-range': '0',
};

const ThermalContext = createContext<ThermalContextValue | null>(null);

export function useThermal(): ThermalContextValue {
  const ctx = useContext(ThermalContext);
  if (!ctx) {
    if (process.env.NODE_ENV === 'development') {
      throw new Error('useThermal() must be used within a <ThermalProvider>');
    }
    return {
      score: 0, state: 'dormant', confidence: 0,
      tokens: {}, animation: FALLBACK_ANIMATION,
      isEngaged: false, archetype: null, refresh: () => {},
    };
  }
  return ctx;
}

export function ThermalProvider({ children }: { children: ReactNode }) {
  const [thermal, setThermal] = useState<AppliedThermal>(() => ({
    result: { score: 0, state: 'dormant', confidence: 0 },
    tokens: {},
    animation: FALLBACK_ANIMATION,
  }));
  const [archetype, setArchetype] = useState<ArchetypeKey | null>(null);

  const refresh = useCallback((plan?: TransitionPlan) => {
    const applied = computeFull();
    applyToDOM(applied, plan);
    setThermal(applied);
  }, []);

  // Compute + apply on mount. Inline script already set CSS vars —
  // this call reconciles React state with the DOM and handles live updates.
  useEffect(() => { refresh(); }, [refresh]);

  // Hydrate archetype from localStorage on mount (Mirror snapshot key).
  // Listen to `storage` so a Mirror taken in another tab updates the voice.
  useEffect(() => {
    setArchetype(readStoredArchetype());
    const onStorage = (e: StorageEvent) => {
      if (e.key === MIRROR_STORAGE_KEY) setArchetype(readStoredArchetype());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<ThermalContextValue>(() => ({
    score: thermal.result.score,
    state: thermal.result.state,
    confidence: thermal.result.confidence,
    tokens: thermal.tokens,
    animation: thermal.animation,
    isEngaged: thermal.result.score >= 25,
    archetype,
    refresh,
  }), [thermal, archetype, refresh]);

  return (
    <ThermalContext.Provider value={value}>
      {children}
    </ThermalContext.Provider>
  );
}
