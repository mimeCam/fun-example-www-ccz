/**
 * Shared token application — writes thermal CSS vars to document.documentElement.
 *
 * Called from:
 * 1. ThermalProvider (React, after hydration — ongoing updates)
 * 2. Inline restore script result reconciliation
 *
 * Pure computation + DOM write. No React. No state.
 */

import { computeThermalScore, type ThermalResult, type ThermalState } from './thermal-score';
import { computeThermalTokens, type ThermalTokens } from './thermal-tokens';
import { computeAnimationTokens, type AnimationTokens } from './thermal-animation';
import { loadHistory, toThermalInput } from './thermal-history';

export interface AppliedThermal {
  result: ThermalResult;
  tokens: ThermalTokens;
  animation: AnimationTokens;
}

/** Compute full thermal pipeline from current localStorage history. */
export function computeFull(): AppliedThermal {
  const history = loadHistory();
  const input = toThermalInput(history);
  const result = computeThermalScore(input);
  const tokens = computeThermalTokens(result.score, result.state);
  const animation = computeAnimationTokens(result.score);
  return { result, tokens, animation };
}

/** Write all thermal CSS vars + data attributes to <html>. */
export function applyToDOM(applied: AppliedThermal): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;

  for (const [k, v] of Object.entries(applied.tokens)) {
    el.style.setProperty(k, v);
  }
  for (const [k, v] of Object.entries(applied.animation)) {
    el.style.setProperty(k, v);
  }

  el.setAttribute('data-thermal', applied.result.state);

  const history = loadHistory();
  el.setAttribute('data-returning', history.visitDays.length > 1 ? 'true' : 'false');
}

/** Read the state already set by the inline blocking script. */
export function readInlineState(): { state: ThermalState; score: number } | null {
  if (typeof document === 'undefined') return null;
  const state = document.documentElement.getAttribute('data-thermal') as ThermalState | null;
  if (!state) return null;
  return { state, score: 0 };
}
