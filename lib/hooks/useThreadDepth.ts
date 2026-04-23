/**
 * useThreadDepth — React binding for the shared ThreadDriver.
 *
 * One hook, one contract: while the component is mounted, the Thread
 * driver is alive and `--thread-depth` is written to the document root
 * every frame a subscriber is present. When the component unmounts and
 * no other subscribers remain, the driver parks (no RAF, no listener).
 *
 * The hook does NOT return state. Returning state on every tick would
 * re-trigger React reconciliation — exactly what we're avoiding. The
 * driver writes a CSS variable; consumers style from it:
 *
 *     <div style={{ height: 'calc(var(--thread-depth, 0) * 100%)' }} />
 *
 * That's the entire contract. Height flows sub-pixel, React renders once.
 *
 * Credits: Mike K. (napkin §5.2 — "Depth becomes a CSS variable, not a
 * React prop"; §4 — the hook's 60 LOC budget, ref-callback pattern).
 */

'use client';

import { useEffect } from 'react';
import { subscribe, type ThreadState } from '@/lib/thread/thread-driver';
import { CHECKPOINTS, emitCheckpoint } from '@/lib/hooks/useLoopFunnel';

/** CSS variable the driver writes on every tick. Consumers read via var(). */
export const THREAD_DEPTH_CSS_VAR = '--thread-depth';

/**
 * Reader-loop "warmed" boundary — the depth at which a session counts
 * as having entered the warmth phase. Aligned with the `stirring` thermal
 * state's lower bound (0.25). Idempotent — `emitCheckpoint` dedupes.
 */
const WARMED_DEPTH_BOUNDARY = 0.25;

/**
 * Build the subscriber that writes --thread-depth to a root element.
 * Pure factory — the element is captured, nothing is read per tick.
 * Side-effect: fires the reader-loop "warmed" checkpoint on first
 * crossing of the boundary (no-op when no article surface is mounted).
 */
function writerFor(root: HTMLElement): (s: ThreadState) => void {
  return (s) => {
    root.style.setProperty(THREAD_DEPTH_CSS_VAR, String(s.depth));
    if (s.depth >= WARMED_DEPTH_BOUNDARY) emitCheckpoint(CHECKPOINTS.WARMED);
  };
}

/**
 * Install the Thread driver for the lifetime of the calling component.
 * Optional `rootRef` binds the CSS variable to a specific subtree; omit
 * for the default (document root, cascades to every descendant).
 */
export function useThreadDepth(rootRef?: React.RefObject<HTMLElement>): void {
  useEffect(() => {
    const root = rootRef?.current ?? (typeof document !== 'undefined' ? document.documentElement : null);
    if (!root) return;
    return subscribe(writerFor(root));
  }, [rootRef]);
}
