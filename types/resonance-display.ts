/**
 * Resonance display types — shared between server actions and client components.
 * No DB imports. Safe for client-side bundling.
 */

import type { Resonance } from './resonance';

/** A resonance enriched with article metadata for display. */
export interface ResonanceWithArticle extends Resonance {
  articleTitle: string;
}

/** Vitality state: above threshold = still alive, below = faded. */
export type VitalityState = 'carrying' | 'shaped';

/**
 * Classify a resonance's vitality state for display.
 * Pure function — no DB dependency.
 */
export function getVitalityLabel(r: Resonance): VitalityState {
  return r.status === 'archived' || r.vitality <= 10 ? 'shaped' : 'carrying';
}
