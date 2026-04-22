/**
 * reduced-motion — one probe, one subscription, two hooks.
 *
 * Promoted out of `usePressPhase.ts` so `useFieldPhase.ts` (and any future
 * phase hook) shares the exact same reading of `prefers-reduced-motion`.
 * Live subscription: flips when the OS setting changes at runtime.
 *
 * Pure read (`readReducedMotion`) is SSR-safe — returns `false` on the
 * server so the initial render never claims to know the user's preference
 * before hydration. The effect then corrects to truth on mount.
 *
 * Credits: Mike K. (shared-code promotion call — napkin §4.3), Tanya D.
 * (reduced-motion contract across primitives).
 */
'use client';

import { useState } from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/utils/use-isomorphic-layout-effect';

/** Media query string — single source of truth; reused in tests & probes. */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Synchronous probe. `false` on the server; truthful on the client. */
export function readReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Subscribe to OS-level changes; returns an unsubscribe fn. Pure wiring. */
export function subscribeReducedMotion(cb: (v: boolean) => void): () => void {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  const handler = (e: MediaQueryListEvent) => cb(e.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}

/** The one hook every phase machine uses. Stable identity, live value. */
export function useReducedMotionFlag(): boolean {
  const [flag, setFlag] = useState(false);
  useIsomorphicLayoutEffect(() => {
    setFlag(readReducedMotion());
    return subscribeReducedMotion(setFlag);
  }, []);
  return flag;
}
