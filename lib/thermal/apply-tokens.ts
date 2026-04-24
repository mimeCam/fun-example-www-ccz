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
import { computeThermalTokens, type ThermalTokens, GESTURE_MIX, ACCENT_OPACITY } from './thermal-tokens';
import { computeAnimationTokens, type AnimationTokens } from './thermal-animation';
import { loadHistory, toThermalInput } from './thermal-history';
import { defaultPlan, returningPlan, type TransitionPlan } from './transition-choreography';
import { readPrefersContrast } from '@/lib/utils/prefers-contrast';

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
export function applyToDOM(applied: AppliedThermal, plan?: TransitionPlan): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;

  for (const [k, v] of Object.entries(applied.tokens)) {
    el.style.setProperty(k, v);
  }
  for (const [k, v] of Object.entries(applied.animation)) {
    el.style.setProperty(k, v);
  }

  // `// reader-invariant` — clamp warming deltas back to dormant anchors
  // when the OS reports `prefers-contrast: more`. Mirrors (authority-side)
  // the `@media (prefers-contrast: more)` block in
  // `lib/design/ambient-surfaces.css`. See Mike #7.1 — the CSS is the
  // authority, this clamp exists only because `computeThermalTokens`
  // runs after hydration and would otherwise overwrite the CSS values.
  // Drift guarded by `lib/design/__tests__/prefers-contrast-sync.test.ts`.
  if (readPrefersContrast()) clampToInvariantPosture(el);

  el.setAttribute('data-thermal', applied.result.state);

  const history = loadHistory();
  const isReturning = history.visitDays.length > 1;
  el.setAttribute('data-returning', isReturning ? 'true' : 'false');

  // Apply transition choreography plan as CSS custom properties.
  // Allows CSS to use dynamic transition durations/delays per context.
  const resolved = plan ?? (isReturning ? returningPlan() : defaultPlan());
  applyChoreographyPlan(el, resolved);
}

/** Pin the four warming deltas to their dormant anchors. Pure DOM write. */
function clampToInvariantPosture(el: HTMLElement): void {
  el.style.setProperty('--token-gesture-mix', GESTURE_MIX.dormant.toFixed(3));
  el.style.setProperty('--token-accent-opacity', ACCENT_OPACITY.dormant.toFixed(2));
  el.style.setProperty('--token-glow', 'none');
  el.style.setProperty('--token-text-glow', 'none');
}

/** Read the state already set by the inline blocking script. */
export function readInlineState(): { state: ThermalState; score: number } | null {
  if (typeof document === 'undefined') return null;
  const state = document.documentElement.getAttribute('data-thermal') as ThermalState | null;
  if (!state) return null;
  const raw = document.documentElement.getAttribute('data-thermal-score');
  const score = raw ? Math.max(0, Math.min(100, parseInt(raw, 10) || 0)) : 0;
  return { state, score };
}

/** Write choreography plan durations/delays as CSS custom properties. */
function applyChoreographyPlan(el: HTMLElement, p: TransitionPlan): void {
  const ms = (v: number) => `${v}ms`;
  el.style.setProperty('--ch-color-dur', ms(p.colorDuration));
  el.style.setProperty('--ch-color-delay', ms(p.colorDelay));
  el.style.setProperty('--ch-space-dur', ms(p.spaceDuration));
  el.style.setProperty('--ch-space-delay', ms(p.spaceDelay));
  el.style.setProperty('--ch-typo-dur', ms(p.typoDuration));
  el.style.setProperty('--ch-typo-delay', ms(p.typoDelay));
  el.style.setProperty('--ch-shadow-dur', ms(p.shadowDuration));
  el.style.setProperty('--ch-shadow-delay', ms(p.shadowDelay));
  el.style.setProperty('--ch-easing', p.easing);
}
