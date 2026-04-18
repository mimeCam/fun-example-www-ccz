/**
 * useEntranceChoreography — article entrance stagger config.
 *
 * Reads thermal state + return status, emits data-attributes
 * for CSS-driven staggered fade-up. No setTimeout, no JS delays.
 * Content is in DOM at frame 0; CSS animation-delay handles the stagger.
 *
 * Speed adapts to thermal warmth:
 *   dormant  → deliberate (80ms gaps, 200ms durations)
 *   stirring → quicker    (60ms gaps, 180ms durations)
 *   warm+    → fast       (40ms gaps, 150ms durations)
 *   reduced-motion → instant (0ms)
 */

import { useThermal } from '@/components/thermal/ThermalProvider';
import { useReturnRecognition } from '@/lib/hooks/useReturnRecognition';
import { useState, useEffect } from 'react';
import type { ThermalState } from '@/lib/thermal/thermal-score';

/** Stagger config for a single entrance section. */
export interface EntranceStep {
  /** data-entrance-step value for CSS targeting. */
  step: number;
  /** animation-delay in ms (CSS custom property value). */
  delay: number;
  /** animation-duration in ms. */
  duration: number;
}

/** Full entrance choreography config for all article sections. */
export interface EntranceConfig {
  topbar: EntranceStep;
  header: EntranceStep;
  divider: EntranceStep;
  prose: EntranceStep;
  /** Whether entrance is disabled (reduced-motion or SSR). */
  disabled: boolean;
}

/** Thermal-state → stagger multiplier. Faster for warm readers. */
function staggerGap(state: ThermalState): number {
  if (state === 'luminous' || state === 'warm') return 40;
  if (state === 'stirring') return 60;
  return 80;
}

/** Thermal-state → motion duration. Faster for warm readers. */
function motionDuration(state: ThermalState): number {
  if (state === 'luminous' || state === 'warm') return 150;
  if (state === 'stirring') return 180;
  return 200;
}

/** Detect prefers-reduced-motion (SSR-safe). */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

/**
 * Returns entrance choreography config for the article page.
 * Each section gets a step number + delay + duration.
 * Apply via data-entrance-step attribute; CSS handles the rest.
 */
export function useEntranceChoreography(): EntranceConfig {
  const { state } = useThermal();
  const { isReturning } = useReturnRecognition();
  const reduced = useReducedMotion();

  // Returning warm readers get the fastest pacing
  const effectiveState: ThermalState =
    isReturning && (state === 'warm' || state === 'luminous')
      ? 'luminous'
      : state;

  if (reduced) {
    return { topbar: s(1,0,0), header: s(2,0,0), divider: s(3,0,0), prose: s(4,0,0), disabled: true };
  }

  const gap = staggerGap(effectiveState);
  const dur = motionDuration(effectiveState);

  return {
    topbar:  s(1, 0,        dur),
    header:  s(2, gap,      dur),
    divider: s(3, gap * 2,  dur),
    prose:   s(4, gap * 3,  dur),
    disabled: false,
  };
}

/** Helper — build an EntranceStep concisely. */
function s(step: number, delay: number, duration: number): EntranceStep {
  return { step, delay, duration };
}
