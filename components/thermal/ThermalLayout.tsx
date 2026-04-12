/**
 * ThermalLayout — client wrapper that applies thermal state site-wide.
 *
 * Wraps children in ThermalProvider and adds thermal animation classes
 * to the body wrapper based on thermal state:
 * - dormant: no animation (stillness)
 * - stirring+: .thermal-breath .thermal-glow on body wrapper
 *
 * Prefers-reduced-motion is handled at two levels:
 * 1. CSS: globals.css kills all animations with !important
 * 2. JS: this component checks matchMedia and skips class application
 */

'use client';

import { useThermal, ThermalProvider } from './ThermalProvider';
import { useEffect, useState, type ReactNode } from 'react';

function ThermalClassApplier({ children }: { children: ReactNode }) {
  const { state } = useThermal();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const animate = !reducedMotion && state !== 'dormant';

  return (
    <div className={animate ? 'thermal-breath thermal-glow thermal-drift' : ''}>
      {children}
    </div>
  );
}

export function ThermalLayout({ children }: { children: ReactNode }) {
  return (
    <ThermalProvider>
      <ThermalClassApplier>{children}</ThermalClassApplier>
    </ThermalProvider>
  );
}
