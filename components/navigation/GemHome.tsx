/**
 * GemHome — fixed home link that shifts color with thermal state.
 *
 * Dormant: nearly invisible (mist/20) — the site is "sealed".
 * Stirring: faint gold edge — "something is here".
 * Warm: clear gold — the site "remembers".
 * Luminous: bright gold with glow — the site is "open".
 *
 * On article pages: always mist/20 — a waypoint, not a lantern.
 * The reader is deep in prose; GemHome should not compete for attention.
 *
 * Slow 1s transition so the shift feels atmospheric, not reactive.
 */

'use client';

import Link from 'next/link';
import { useThermal } from '@/components/thermal/ThermalProvider';
import { GemIcon } from '@/components/shared/GemIcon';

function gemColor(state: string, quiet: boolean): string {
  if (quiet) return 'text-mist/20';
  switch (state) {
    case 'luminous': return 'text-gold/80';
    case 'warm':     return 'text-gold/60';
    case 'stirring': return 'text-gold/30';
    default:         return 'text-mist/20';
  }
}

function gemShadow(state: string, quiet: boolean): string {
  if (quiet) return '';
  return state === 'luminous' ? 'drop-shadow-[0_0_6px_color-mix(in_srgb,var(--gold)_40%,transparent)]' : '';
}

interface GemHomeProps {
  /** On article pages, suppress thermal glow — waypoint, not lantern. */
  quiet?: boolean;
}

export function GemHome({ quiet = false }: GemHomeProps) {
  const { state } = useThermal();

  return (
    <Link
      href="/"
      className={`fixed top-sys-4 left-sys-6 z-sys-gem hover:text-gold
        transition-colors duration-linger ease-out
        ${gemColor(state, quiet)} ${gemShadow(state, quiet)}`}
      aria-label="Home"
    >
      <GemIcon />
    </Link>
  );
}
