/**
 * useKeepsakePreview — glue hook between the ceremony, the frozen
 * thread snapshot, the reader's archetype, and the modal open/close
 * state for the inline `KeepsakePlate`.
 *
 * The Plate is a *passive* surface — it never asks the page when it
 * should appear, it asks this hook. The hook in turn asks:
 *
 *   • `useThreadSnapshot()` — the SAME frozen object the modal will
 *     render. One snapshot, two surfaces (preview === unfurl). Mike §6.2.
 *   • `useCeremony().phase`  — only `gifting` and `settled` may reveal.
 *     Earlier phases belong to the shimmer.
 *   • `useMirror()`         — supplies archetype, or `null` for stranger
 *     readers (rendered posture-only via `archetypeLabel(null)`).
 *   • `prefers-reduced-motion` — clarifies the reveal, never warms it.
 *
 * Returns a tiny, typed surface so the component stays presentational:
 *   { snapshot, revealState, archetype, isOpen, open, close }
 *
 * No fetch, no state machine, no timers. Reads context, returns a view.
 *
 * Credits: Mike K. (napkin §4 — the "thin glue" pattern, frozen-snapshot
 * discipline), Tanya D. (UX #74 §2.3 — three-beat reveal cadence,
 * reduced-motion guidance), Paul K. (experience #3+#4 framing).
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useThreadSnapshot } from '@/lib/hooks/useThreadSnapshot';
import { useCeremony, type CeremonyPhase } from '@/components/reading/CeremonySequencer';
import { useMirror } from '@/lib/hooks/useMirror';
import type { ArchetypeKey } from '@/types/content';
import type { ThreadSnapshot } from '@/lib/sharing/thread-render';

/** Reveal state — what the Plate should paint, no more. */
export type PlateRevealState =
  | 'hidden'   // ceremony hasn't reached `gifting` yet — render nothing
  | 'reveal'   // first paint of the Plate, runs the entrance beat
  | 'settled'; // ceremony resolved — at-rest opacity, no transition

/** Inputs the hook needs from the host page. */
export interface UseKeepsakePreviewInputs {
  articleId: string;
  title: string;
}

/** Return surface — small enough to pattern-match in one read. */
export interface UseKeepsakePreviewReturn {
  snapshot: ThreadSnapshot | null;
  revealState: PlateRevealState;
  archetype: ArchetypeKey | null;
  reduced: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/**
 * Map a ceremony phase to the Plate's reveal state. Pure, total over the
 * five-phase domain. Exported for tests; the runtime path is the hook.
 */
export function revealForPhase(phase: CeremonyPhase): PlateRevealState {
  if (phase === 'gifting') return 'reveal';
  if (phase === 'settled') return 'settled';
  return 'hidden';
}

/** SSR-safe `prefers-reduced-motion` query. Subscribes for live updates. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/**
 * The hook itself — all glue, no logic. Returns a presentation-ready
 * view for `KeepsakePlate`. Idempotent across re-renders.
 */
export function useKeepsakePreview(
  inputs: UseKeepsakePreviewInputs,
): UseKeepsakePreviewReturn {
  const { phase } = useCeremony();
  const { mirror } = useMirror();
  const archetype = (mirror?.archetype as ArchetypeKey | undefined) ?? null;
  const snapshot = useThreadSnapshot({
    slug: inputs.articleId,
    title: inputs.title,
    archetype,
  });
  const reduced = usePrefersReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return {
    snapshot,
    revealState: revealForPhase(phase),
    archetype, reduced, isOpen, open, close,
  };
}
