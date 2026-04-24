/**
 * prefers-contrast — one probe, one subscription, one hook.
 *
 * Byte-for-byte sibling of `lib/utils/reduced-motion.ts` (Mike #6 — the
 * two files MUST be indistinguishable in shape). When the reader's OS
 * declares `prefers-contrast: more`, the site stops courting them: thermal
 * warming on ambient surfaces collapses to its dormant posture, gold halos
 * flatten to hairlines, and the room clears. The focus ring stays
 * byte-identical — it is already `// reader-invariant`.
 *
 * Pure read (`readPrefersContrast`) is SSR-safe — returns `false` on the
 * server so the initial render never claims to know the user's preference
 * before hydration. The effect then corrects to truth on mount.
 *
 * Credits: Mike K. (napkin #6 — shared-code promotion, sibling-of-reduced-
 * motion shape), Tanya D. (UX §2 — "the Invariant posture generalised from
 * five named surfaces to every surface"), Elon M. (boring-names-compose —
 * no `Sanctuaries` noun, reuse `// reader-invariant`), Krystle C. (the
 * surgical PR scope this probe lives inside).
 */
'use client';

import { useState } from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/utils/use-isomorphic-layout-effect';

/** Media query string — single source of truth; reused in tests & probes. */
export const PREFERS_CONTRAST_QUERY = '(prefers-contrast: more)';

/** Synchronous probe. `false` on the server; truthful on the client. */
export function readPrefersContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(PREFERS_CONTRAST_QUERY).matches;
}

/** Subscribe to OS-level changes; returns an unsubscribe fn. Pure wiring. */
export function subscribePrefersContrast(cb: (v: boolean) => void): () => void {
  const mq = window.matchMedia(PREFERS_CONTRAST_QUERY);
  const handler = (e: MediaQueryListEvent) => cb(e.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}

/** The one hook every consumer uses. Stable identity, live value. */
export function usePrefersContrastFlag(): boolean {
  const [flag, setFlag] = useState(false);
  useIsomorphicLayoutEffect(() => {
    setFlag(readPrefersContrast());
    return subscribePrefersContrast(setFlag);
  }, []);
  return flag;
}
