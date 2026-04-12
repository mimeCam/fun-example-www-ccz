/**
 * nav-pulse — pure function mapping thermal state to nav dot layer config.
 *
 * No React, no DOM. Testable in any environment.
 */

import type { ThermalState } from './thermal-score';

export interface NavDotConfig {
  showRing: boolean;
  showAura: boolean;
}

/** Maps thermal state to nav dot layer visibility. */
export function navDotConfig(state: ThermalState): NavDotConfig {
  if (state === 'dormant') return { showRing: false, showAura: false };
  if (state === 'stirring') return { showRing: true, showAura: false };
  return { showRing: true, showAura: true };
}
