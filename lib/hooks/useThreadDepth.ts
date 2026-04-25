/**
 * useThreadDepth — React binding for the shared ThreadDriver.
 *
 * One hook, one contract: while the component is mounted, the Thread
 * driver is alive and three CSS variables are written to the document
 * root every frame a subscriber is present:
 *
 *     --thread-depth       (0..1) tide mark height — never retreats
 *     --thread-tide-delta  (0..1) how far reader is below their mark
 *     --thread-is-settled  (0|1)  1 = reader below tide mark by > 2%
 *
 * A data attribute mirrors the settled flag for CSS animation gating:
 *
 *     data-thread-settled="0|1" on the root element
 *
 * The hook does NOT return state. Returning state on every tick would
 * re-trigger React reconciliation — exactly what we're avoiding. The
 * driver writes CSS variables; consumers style from them:
 *
 *     <div style={{ height: 'calc(var(--thread-depth, 0) * 100%)' }} />
 *
 * That's the entire contract. Height flows sub-pixel, React renders once.
 *
 * Credits: Mike K. (napkin §5.2 — "Depth becomes a CSS variable, not a
 * React prop"; §4 — the hook's 60 LOC budget, ref-callback pattern),
 * Tanya D. (UIX spec §1 — tide mark semantics, settled breathing gating).
 */

'use client';

import { useEffect } from 'react';
import { subscribe, type ThreadState } from '@/lib/thread/thread-driver';
import { CHECKPOINTS, emitCheckpoint } from '@/lib/hooks/useLoopFunnel';

/** CSS variable the driver writes for the tide mark height. */
export const THREAD_DEPTH_CSS_VAR = '--thread-depth';

/** CSS variable: how far reader is below their tide mark (0..1). */
export const THREAD_TIDE_DELTA_CSS_VAR = '--thread-tide-delta';

/** CSS variable: 1 = reader is below tide mark, 0 = at/advancing. */
export const THREAD_IS_SETTLED_CSS_VAR = '--thread-is-settled';

/**
 * Reader-loop "warmed" boundary — the depth at which a session counts
 * as having entered the warmth phase. Aligned with the `stirring` thermal
 * state's lower bound (0.25). Idempotent — `emitCheckpoint` dedupes.
 */
const WARMED_DEPTH_BOUNDARY = 0.25;

/**
 * Build the subscriber that writes thread CSS vars to a root element.
 * Pure factory — the element is captured, nothing is read per tick.
 * Side-effect: fires the reader-loop "warmed" checkpoint on first
 * crossing of the boundary (no-op when no article surface is mounted).
 */
function writerFor(root: HTMLElement): (s: ThreadState) => void {
  return (s) => {
    root.style.setProperty(THREAD_DEPTH_CSS_VAR, String(s.depth));
    root.style.setProperty(THREAD_TIDE_DELTA_CSS_VAR, String(s.tideDelta));
    root.style.setProperty(THREAD_IS_SETTLED_CSS_VAR, s.isSettled ? '1' : '0');
    root.dataset.threadSettled = s.isSettled ? '1' : '0';
    if (s.depth >= WARMED_DEPTH_BOUNDARY) emitCheckpoint(CHECKPOINTS.WARMED);
  };
}

/**
 * Install the Thread driver for the lifetime of the calling component.
 * Optional `rootRef` binds the CSS variables to a specific subtree; omit
 * for the default (document root, cascades to every descendant).
 */
export function useThreadDepth(rootRef?: React.RefObject<HTMLElement>): void {
  useEffect(() => {
    const root = rootRef?.current ?? (typeof document !== 'undefined' ? document.documentElement : null);
    if (!root) return;
    return subscribe(writerFor(root));
  }, [rootRef]);
}
