/**
 * useSharedHighlightOnLand — recipient side of the selection-share gesture.
 *
 * Runs once per article mount. If the URL carries
 * `#highlight=HASH&text=ENCODED` (the contract emitted by
 * `lib/sharing/share-links.ts`), wait one animation frame so
 * `StratifiedRenderer` paints, then walk the DOM with
 * `scrollToSharedHighlight(text)` — center the matching paragraph in
 * viewport, fire a one-shot pulse, and `clearHighlightFragment()` so a
 * subsequent share gesture from this session starts on a clean URL.
 *
 * The "land at viewport center" promise is what makes anchor-offset math
 * irrelevant on this site (Mike #39 §1, Tanya UIX §6 — `block: 'center'`
 * dodges any future top chrome by construction). Reduced-motion readers
 * get an instant scroll + no pulse — the witness lands; only the easing
 * and the scale animation fall away.
 *
 * SSR-safe: the hook is a no-op on the server. The `'use client'` envelope
 * keeps the article route's server component clean — the wrapper that
 * calls this hook is already a client island.
 *
 * Credits: Mike K. (#39 — the recipient-side contract, the rAF handshake
 * with StratifiedRenderer, the URL self-clean), Tanya D. (UIX — center-
 * paint over anchor-math, reduced-motion fork), Sid (this hook; ≤ 10 LOC
 * per helper, single home for the rAF + idempotency guard).
 */
'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import {
  parseHighlightFragment, clearHighlightFragment,
} from '@/lib/sharing/share-links';
import { scrollToSharedHighlight } from '@/lib/sharing/highlight-finder';

/** Resolve the rAF after the next paint, then run the lookup + pulse. */
function landOn(text: string, reduced: boolean): void {
  requestAnimationFrame(() => {
    scrollToSharedHighlight(text, reduced);
    clearHighlightFragment();
  });
}

/**
 * Mounts once per article view. The internal ref guards against
 * double-fire on React 18 strict-mode double effect — the lookup walks
 * the DOM exactly once per landed URL.
 */
export function useSharedHighlightOnLand(): void {
  const reduced = useReducedMotion();
  const handledRef = useRef(false);
  useEffect(() => {
    if (handledRef.current) return;
    const text = parseHighlightFragment();
    if (!text) return;
    handledRef.current = true;
    landOn(text, reduced);
  }, [reduced]);
}

// ─── Test seam — pure handles for the source-pin tests ────────────────────
//
// The hook itself touches `window` + the DOM, so jest's `node`
// environment cannot exercise it. The pin asserts that the right
// imports are wired (parse + clear + scroll) and that the rAF gate is
// in place — drift would silently break the gesture in production.
export const __testing__ = { landOn } as const;
