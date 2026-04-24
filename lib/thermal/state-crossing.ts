/**
 * State Crossing — types, intensity map, and event bus for mid-reading crossings.
 *
 * When thermal state crosses dormant→stirring, stirring→warm, or warm→luminous,
 * this module emits a window CustomEvent. GoldenThread and StateCrossingFlash
 * subscribe independently — no prop drilling, no React context.
 *
 * Pattern mirrors THRESHOLD_OPENING_EVENT in lib/hooks/useThreshold.ts.
 * "Flat event dispatch beats a crossed subscriber hierarchy every time." — Mike K.
 *
 * Credits: Mike K. (architecture — state-crossing napkin), Tanya D. (UIX spec
 * §3 threshold moment specs per state).
 */

import type { ThermalState } from './thermal-score';

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * Intensity tier for a crossing — reused by CeremonySequencer.
 * Defined here (lib layer) so CeremonySequencer can import it,
 * keeping direction clean: component imports from lib, not vice versa.
 */
export type CrossingIntensity = 'subtle' | 'present' | 'radiant';

/** A single state crossing with its direction and intensity. */
export interface ThermalStateCrossing {
  from: ThermalState;
  to:   ThermalState;
  intensity: CrossingIntensity;
}

// ─── Opacity constants — CSS sync guard reads these ────────────────────────

/**
 * Peak opacity per intensity tier. CSS `--crossing-peak-opacity-*` must
 * match these values exactly. The sync test in __tests__/state-crossing.test.ts
 * enforces parity (same strategy as motion-sync.test.ts).
 */
export const CROSSING_PEAK_OPACITY: Record<CrossingIntensity, number> = {
  subtle:  0.4,
  present: 0.6,
  radiant: 0.8,
};

// ─── Crossing intensity map ─────────────────────────────────────────────────

/** Forward-only crossing pairs → intensity. Reverse crossings don't emit. */
const INTENSITY_MAP: Partial<Record<string, CrossingIntensity>> = {
  'dormant→stirring': 'subtle',
  'stirring→warm':    'present',
  'warm→luminous':    'radiant',
};

/** Derive intensity for a state pair. Returns null for non-forward crossings. */
export function crossingIntensity(
  from: ThermalState,
  to: ThermalState,
): CrossingIntensity | null {
  return INTENSITY_MAP[`${from}→${to}`] ?? null;
}

// ─── Event bus — window CustomEvent, SSR-safe ───────────────────────────────

/** Dispatched on window when a thermal state crossing occurs mid-reading. */
export const STATE_CROSSING_EVENT = 'thermal:state-crossing';

/** Emit a crossing event on window. No-ops when SSR or non-forward pair. */
export function emitCrossing(from: ThermalState, to: ThermalState): void {
  if (typeof window === 'undefined') return;
  const intensity = crossingIntensity(from, to);
  if (!intensity) return;
  const detail: ThermalStateCrossing = { from, to, intensity };
  window.dispatchEvent(new CustomEvent(STATE_CROSSING_EVENT, { detail }));
}

/** Subscribe to crossing events. Returns cleanup. SSR-safe. */
export function onCrossing(
  handler: (c: ThermalStateCrossing) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) =>
    handler((e as CustomEvent<ThermalStateCrossing>).detail);
  window.addEventListener(STATE_CROSSING_EVENT, listener);
  return () => window.removeEventListener(STATE_CROSSING_EVENT, listener);
}
