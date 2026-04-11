/**
 * ThermalProvider — React Context distributing thermal state to the component tree.
 *
 * Loads history from localStorage on mount, computes score + state + tokens,
 * applies CSS vars to <html> via useEffect with 500ms debounce.
 * Provides { score, state, tokens, refresh } to consumers.
 *
 * V1: binary cold/warm based on reading_memory existence.
 * V2: continuous 0-100 interpolation (engine already supports it).
 */

'use client';

import {
  createContext, useContext, useState, useEffect, useCallback,
  useMemo, type ReactNode,
} from 'react';
import { computeThermalScore, type ThermalState, type ThermalResult } from '@/lib/thermal/thermal-score';
import { computeThermalTokens, type ThermalTokens } from '@/lib/thermal/thermal-tokens';
import { computeAnimationTokens, type AnimationTokens } from '@/lib/thermal/thermal-animation';
import { loadHistory, toThermalInput } from '@/lib/thermal/thermal-history';

interface ThermalContextValue {
  score: number;
  state: ThermalState;
  confidence: number;
  tokens: ThermalTokens;
  animation: AnimationTokens;
  isWarm: boolean;
  refresh: () => void;
}

const ThermalContext = createContext<ThermalContextValue | null>(null);

export function useThermal(): ThermalContextValue {
  const ctx = useContext(ThermalContext);
  if (!ctx) {
    // Safe fallback for SSR or when provider is absent — site renders at dormant defaults
    return {
      score: 0, state: 'dormant', confidence: 0,
      tokens: {}, animation: computeAnimationTokens(0),
      isWarm: false, refresh: () => {},
    };
  }
  return ctx;
}

function computeFromHistory(): { result: ThermalResult; tokens: ThermalTokens; animation: AnimationTokens } {
  const history = loadHistory();
  const input = toThermalInput(history);
  const result = computeThermalScore(input);
  const tokens = computeThermalTokens(result.score, result.state);
  const animation = computeAnimationTokens(result.score);
  return { result, tokens, animation };
}

export function ThermalProvider({ children }: { children: ReactNode }) {
  const [thermal, setThermal] = useState<{
    result: ThermalResult; tokens: ThermalTokens; animation: AnimationTokens;
  }>({
    result: { score: 0, state: 'dormant', confidence: 0 },
    tokens: {},
    animation: computeAnimationTokens(0),
  });

  const refresh = useCallback(() => {
    setThermal(computeFromHistory());
  }, []);

  // Compute on mount
  useEffect(() => { refresh(); }, [refresh]);

  // Apply CSS custom properties to <html> — debounced to avoid thrashing
  useEffect(() => {
    const el = document.documentElement;
    const colorEntries = Object.entries(thermal.tokens);
    const animEntries = Object.entries(thermal.animation);
    if (!colorEntries.length && !animEntries.length) return;
    const timer = setTimeout(() => {
      for (const [key, value] of colorEntries) el.style.setProperty(key, value);
      for (const [key, value] of animEntries) el.style.setProperty(key, value);
      el.setAttribute('data-thermal', thermal.result.state);
    }, 100);
    return () => clearTimeout(timer);
  }, [thermal]);

  const value = useMemo<ThermalContextValue>(() => ({
    score: thermal.result.score,
    state: thermal.result.state,
    confidence: thermal.result.confidence,
    tokens: thermal.tokens,
    animation: thermal.animation,
    isWarm: thermal.result.score >= 25,
    refresh,
  }), [thermal, refresh]);

  return (
    <ThermalContext.Provider value={value}>
      {children}
    </ThermalContext.Provider>
  );
}
