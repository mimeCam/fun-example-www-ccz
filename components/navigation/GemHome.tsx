/**
 * GemHome — fixed home link that shifts color with thermal state.
 *
 * Dormant: nearly invisible (mist/20) — the site is "sealed".
 * Stirring: faint gold edge — "something is here".
 * Warm: clear gold — the site "remembers".
 * Luminous: bright gold with glow — the site is "open".
 *
 * Slow 1s transition so the shift feels atmospheric, not reactive.
 */

'use client';

import Link from 'next/link';
import { useThermal } from '@/components/thermal/ThermalProvider';

function gemColor(state: string): string {
  switch (state) {
    case 'luminous': return 'text-gold/80';
    case 'warm':     return 'text-gold/60';
    case 'stirring': return 'text-gold/30';
    default:         return 'text-mist/20';
  }
}

function gemShadow(state: string): string {
  return state === 'luminous' ? 'drop-shadow-[0_0_6px_rgba(240,198,116,0.4)]' : '';
}

export function GemHome() {
  const { state } = useThermal();

  return (
    <Link
      href="/"
      className={`fixed top-4 left-4 z-30 hover:text-gold
        transition-colors duration-linger ease-out
        ${gemColor(state)} ${gemShadow(state)}`}
      aria-label="Home"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 9l10 13L22 9L12 2z" />
      </svg>
    </Link>
  );
}
