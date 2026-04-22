/**
 * useLinkPhase — minimal state machine for the `<TextLink>` surface.
 *
 * Owns the `idle → hover → idle` and `idle → focus → idle` transitions.
 * Hover + focus are orthogonal (keyboard user can be focused while the
 * mouse hovers a different anchor) — we pick the "louder" phase so the
 * style resolver sees a single LinkPhase value.
 *
 * Pointer-only enter/leave (not mouseenter) to match `Pressable` — one
 * event vocabulary across primitives. Reduced motion comes from the
 * shared probe so every phase hook reads one subscription.
 *
 * Credits: Mike K. (phase-machine template, pointer-only insistence),
 * Tanya D. (focus-over-hover ordering for a11y clarity), Krystle C.
 * (shared reduced-motion probe convention).
 */

'use client';

import {
  useMemo, useReducer,
  type FocusEvent,
} from 'react';
import { useReducedMotionFlag } from '@/lib/utils/reduced-motion';
import type { LinkPhase } from '@/lib/utils/link-phase';

// ─── Reducer — pure, trivially testable ────────────────────────────────────

export type LinkAction =
  | { type: 'ENTER' }
  | { type: 'LEAVE' }
  | { type: 'FOCUS' }
  | { type: 'BLUR' };

/**
 * Pure state transition. Focus wins over hover: once a keyboard user
 * tabs in, a stray pointer leave does not mute the focus ring.
 */
export function linkReducer(phase: LinkPhase, action: LinkAction): LinkPhase {
  if (action.type === 'FOCUS') return 'focus';
  if (action.type === 'BLUR') return phase === 'focus' ? 'idle' : phase;
  if (action.type === 'ENTER') return phase === 'focus' ? phase : 'hover';
  if (action.type === 'LEAVE') return phase === 'focus' ? phase : 'idle';
  return phase;
}

// ─── Handler factories — 2-3 LOC each ─────────────────────────────────────

interface Handlers {
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onFocus: (e: FocusEvent<HTMLElement>) => void;
  onBlur: (e: FocusEvent<HTMLElement>) => void;
}

function buildHandlers(dispatch: React.Dispatch<LinkAction>): Handlers {
  return {
    onPointerEnter: () => dispatch({ type: 'ENTER' }),
    onPointerLeave: () => dispatch({ type: 'LEAVE' }),
    onFocus: () => dispatch({ type: 'FOCUS' }),
    onBlur: () => dispatch({ type: 'BLUR' }),
  };
}

// ─── Public hook ───────────────────────────────────────────────────────────

export interface UseLinkPhaseResult {
  phase: LinkPhase;
  reduced: boolean;
  handlers: Handlers;
}

/**
 * Wire the return value's `handlers` onto a native `<a>` or `next/link`.
 * `phase` + `reduced` feed `resolveLinkStyle()` for the inline style.
 */
export function useLinkPhase(): UseLinkPhaseResult {
  const [phase, dispatch] = useReducer(linkReducer, 'idle');
  const reduced = useReducedMotionFlag();
  const handlers = useMemo(() => buildHandlers(dispatch), [dispatch]);
  return { phase, reduced, handlers };
}
