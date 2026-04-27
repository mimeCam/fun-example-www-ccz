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
import { gestureClassesOf } from '@/lib/design/gestures';

function gemColor(state: string, quiet: boolean): string {
  if (quiet) return 'text-mist/20';
  switch (state) {
    case 'luminous': return 'text-gold/80';
    case 'warm':     return 'text-gold/60';
    case 'stirring': return 'text-gold/30';
    default:         return 'text-mist/20';
  }
}

/* Luminous gem halo routes through the Elevation Ledger's `whisper` beat —
   gold-tinted, low-alpha — using the filter-based drop-shadow variant so
   the halo follows the SVG silhouette instead of painting a rectangle.
   Quiet article-page state stays bare (no halo). */
function gemShadow(state: string, quiet: boolean): string {
  if (quiet) return '';
  return state === 'luminous' ? 'drop-shadow-sys-whisper' : '';
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
      // `rounded-sys-full` pairs the global :focus-visible ring with the gem's
      // round silhouette — a pill ring around the gem instead of a 0-radius
      // box (honoring-ring, Tanya #93 §4 / Mike napkin §4.3).
      className={`rounded-sys-full fixed top-sys-4 left-sys-6 z-sys-gem hover:text-gold
        transition-colors ${gestureClassesOf('whisper-linger')}
        ${gemColor(state, quiet)} ${gemShadow(state, quiet)}`}
      aria-label="Home"
    >
      <GemIcon />
    </Link>
  );
}
