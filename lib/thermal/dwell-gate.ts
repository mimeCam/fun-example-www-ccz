/**
 * Dwell Gate — gates content reveals on dwell time, not just scroll depth.
 *
 * Replaces the old scroll-only trigger in useQuickMirror.
 * Rule: reveal when scrollDepth >= trigger AND dwellSecsAtDepth >= minDwell.
 *
 * This prevents speed-scrollers from getting the same archetype reveal
 * as careful readers who actually dwell on the content.
 */

export interface DwellGateInput {
  scrollDepth: number;        // current scroll depth (0-100)
  dwellSecsAtDepth: number;   // seconds spent at or beyond trigger depth
  triggerDepth: number;       // scroll threshold (e.g. 30)
  minDwell: number;           // minimum seconds at that depth (e.g. 15)
}

/** Returns true if both scroll and dwell thresholds are met. */
export function shouldReveal(input: DwellGateInput): boolean {
  return input.scrollDepth >= input.triggerDepth
    && input.dwellSecsAtDepth >= input.minDwell;
}

/** Default thresholds per feature. */
export const QUICK_MIRROR_GATE = { triggerDepth: 30, minDwell: 15 };
export const EXTENSION_GATE = { triggerDepth: 50, minDwell: 20 };
