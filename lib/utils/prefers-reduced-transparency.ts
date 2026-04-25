/**
 * prefers-reduced-transparency — one probe, one subscription, one hook.
 *
 * Byte-for-byte sibling of `lib/utils/prefers-contrast.ts` and
 * `lib/utils/reduced-motion.ts` (Mike #6 — the three files MUST be
 * indistinguishable in shape). When the reader's OS declares
 * `prefers-reduced-transparency: reduce`, the room stops dissolving:
 * tinted glass becomes painted wall, blur drops to 0, halos collapse,
 * and `::selection` paints as a solid inverted chip instead of a film.
 * The thermal warmth still rides — temperature is information, not
 * decoration — but it rides on solid ground (Tanya §1).
 *
 * Pure read (`readPrefersReducedTransparency`) is SSR-safe — returns
 * `false` on the server so the initial render never claims to know the
 * user's preference before hydration. The effect then corrects to truth
 * on mount.
 *
 * Credits: Mike K. (napkin #71 — sibling-of-prefers-contrast shape, the
 * 6th OS-honor query), Tanya D. (UX §1/§3 — "glass becomes wall, halo
 * becomes line, mist becomes paper"), Krystle C. (the surgical PR scope
 * this probe lives inside), Elon M. (boring-names-compose — reuse
 * `// reader-invariant`, no new noun), Paul K. (one-PR-three-artifacts
 * gate — probe + CSS + sync test land together).
 */
'use client';

import { useState } from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/utils/use-isomorphic-layout-effect';

/** Media query string — single source of truth; reused in tests & probes. */
export const PREFERS_REDUCED_TRANSPARENCY_QUERY = '(prefers-reduced-transparency: reduce)';

/** Synchronous probe. `false` on the server; truthful on the client. */
export function readPrefersReducedTransparency(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(PREFERS_REDUCED_TRANSPARENCY_QUERY).matches;
}

/** Subscribe to OS-level changes; returns an unsubscribe fn. Pure wiring. */
export function subscribePrefersReducedTransparency(cb: (v: boolean) => void): () => void {
  const mq = window.matchMedia(PREFERS_REDUCED_TRANSPARENCY_QUERY);
  const handler = (e: MediaQueryListEvent) => cb(e.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}

/** The one hook every consumer uses. Stable identity, live value. */
export function usePrefersReducedTransparencyFlag(): boolean {
  const [flag, setFlag] = useState(false);
  useIsomorphicLayoutEffect(() => {
    setFlag(readPrefersReducedTransparency());
    return subscribePrefersReducedTransparency(setFlag);
  }, []);
  return flag;
}
