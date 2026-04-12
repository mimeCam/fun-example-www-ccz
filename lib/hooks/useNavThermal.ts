/**
 * useNavThermal — hook wrapper around the pure navDotConfig function.
 *
 * Reads thermal context, returns dot layer config.
 * React re-renders only when thermal state changes (max 4 times per session).
 * Color/glow/animation intensity flow through CSS custom properties — zero re-renders.
 */

import { useThermal } from '@/components/thermal/ThermalProvider';
import { navDotConfig } from '@/lib/thermal/nav-pulse';

export type { NavDotConfig } from '@/lib/thermal/nav-pulse';
export { navDotConfig } from '@/lib/thermal/nav-pulse';

/** Hook: reads thermal context, returns dot layer config. */
export function useNavThermal() {
  const { state } = useThermal();
  return navDotConfig(state);
}
