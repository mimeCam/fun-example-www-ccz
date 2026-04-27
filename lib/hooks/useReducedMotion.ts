/**
 * useReducedMotion — SSR-safe React hook for `prefers-reduced-motion`.
 *
 * Returns `true` when the OS-level "reduce motion" preference is on. Server
 * renders default to `false` (the full-motion path) — there is no header
 * carrier for `prefers-reduced-motion`, so the first paint cannot pre-
 * resolve it. On hydration the listener attaches and the second render
 * swaps to the floor when the query matches. This matches every other
 * media-query-driven CSR hook in this codebase (Mike napkin #88 §5.3).
 *
 * Pure subscriber, no side-effects beyond the listener it owns. Cleans up
 * on unmount. Live updates (the user toggles the OS preference mid-session)
 * propagate via the `change` event — no manual refresh needed.
 *
 * Canonical consumer pattern at the call site (Mike #88, the killer feature
 * is the first to use it):
 *
 * ```tsx
 * 'use client';
 * import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
 * import { gestureClassesForMotion } from '@/lib/design/gestures';
 *
 * export default function Card() {
 *   const reduce = useReducedMotion();
 *   return <div className={`transition-all ${gestureClassesForMotion('reveal-keepsake', reduce)}`} />;
 * }
 * ```
 *
 * Why not `framer-motion`/`react-aria`/`@react-hook/media-query`: a 30-line
 * custom hook is simpler, has one source of truth, and sidesteps the
 * "bundle a library to read one boolean" anti-pattern (Mike #88 §3).
 *
 * Credits: Mike K. (architect napkin #88 — the SSR-safe shape, single
 * source of truth, the JIT-literal contract this hook is the runtime
 * carrier for), Tanya D. (UX #97 §4 — the reduced-motion is its own felt
 * sentence stance that justifies the consumer-side wiring), prior art —
 * the private `usePrefersReducedMotion` already inside `useKeepsakePreview.ts`.
 */
'use client';

import { useEffect, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** SSR-safe: `false` on the server, live-updating boolean on the client. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(false);
  useEffect(() => subscribe(setReduced), []);
  return reduced;
}

/** Imperative subscription helper. Returns the cleanup. ≤ 10 LoC. */
function subscribe(set: (next: boolean) => void): (() => void) | undefined {
  if (typeof window === 'undefined' || !window.matchMedia) return undefined;
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  set(mql.matches);
  const onChange = (e: MediaQueryListEvent): void => set(e.matches);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

/**
 * Test seam — the literal media-query string the hook subscribes to. Pinned
 * by the unit test so a future refactor cannot silently drift the query.
 */
export const __testing__ = { REDUCED_MOTION_QUERY, subscribe } as const;
