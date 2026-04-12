/**
 * NavPulseDot — thermal-aware pulse indicator for the active nav item.
 *
 * Three visual layers: core dot (6px), glow ring (10px), aura halo (16px).
 * Layer count grows with thermal state; color/glow/animation driven by CSS tokens.
 * Decorative — aria-hidden, respects prefers-reduced-motion.
 */

'use client';

import { useNavThermal } from '@/lib/hooks/useNavThermal';

export function NavPulseDot() {
  const { showRing, showAura } = useNavThermal();

  return (
    <span className="nav-pulse-dot" aria-hidden="true">
      {showAura && <span className="nav-pulse-aura" />}
      {showRing && <span className="nav-pulse-ring" />}
      <span className="nav-pulse-core" />
    </span>
  );
}
