/**
 * GemHome — fixed home link that shifts color with thermal state.
 *
 * Dormant: nearly invisible (mist/hairline) — the site is "sealed".
 * Stirring: faint gold edge (gold/muted) — "something is here".
 * Warm: clear gold (gold/recede) — the site "remembers".
 * Luminous: bright gold with halo (gold/quiet + drop-shadow) — the site is "open".
 *
 * On article pages: collapses to mist/hairline regardless of thermal state —
 * a waypoint, not a lantern. The reader is deep in prose; GemHome should
 * not compete for attention.
 *
 * Slow 1s transition so the shift feels atmospheric, not reactive.
 *
 * Paint dialect graduated to the Voice Ledger via `lib/design/nav-paint.ts`
 * (Mike napkin #90 / Tanya UX #42). The four state classes are no longer
 * spelled here — they live in `gemPaint()`, which routes through
 * `alphaClassOf()` so the rungs stay snapped to the Alpha Ledger and the
 * Tailwind JIT sees every literal at compile time.
 */

'use client';

import Link from 'next/link';
import { useThermal } from '@/components/thermal/ThermalProvider';
import { GemIcon } from '@/components/shared/GemIcon';
import { gestureClassesOf } from '@/lib/design/gestures';
import { gemPaint, gemShadow } from '@/lib/design/nav-paint';

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
        ${gemPaint(state, quiet)} ${gemShadow(state, quiet)}`}
      aria-label="Home"
    >
      <GemIcon />
    </Link>
  );
}
