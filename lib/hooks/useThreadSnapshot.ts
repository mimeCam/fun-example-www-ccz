/**
 * useThreadSnapshot — freezes the Golden Thread's reader-specific state
 * at the ceremony `glowing` phase, so the keepsake artifact stays stable
 * after the page keeps warming.
 *
 * "Freeze tokens at capture." Mike §6.2 — two screenshots ten seconds
 * apart must not disagree. The snapshot is therefore memoized the first
 * time a ceremony fires, and only reset when the article changes.
 */
'use client';

import { useEffect, useState } from 'react';
import { useThermal } from '@/components/thermal/ThermalProvider';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';
import { useCeremony, type CeremonyPhase } from '@/components/reading/CeremonySequencer';
import type { ArchetypeKey } from '@/types/content';
import type { ThreadSnapshot } from '@/lib/sharing/thread-render';

export interface SnapshotInputs {
  slug: string;
  title: string;
  archetype: ArchetypeKey | null;
}

const FROZEN_PHASES: ReadonlySet<CeremonyPhase> =
  new Set(['warming', 'gifting', 'settled']);

function isCeremonyFrozen(phase: CeremonyPhase): boolean {
  return FROZEN_PHASES.has(phase);
}

function buildSnapshot(inputs: SnapshotInputs, depth: number, score: number): ThreadSnapshot {
  return {
    slug: inputs.slug,
    title: inputs.title,
    depth: Math.max(0, Math.min(100, depth)),
    thermal: Math.max(0, Math.min(1, score / 100)),
    archetype: inputs.archetype,
    ts: Math.floor(Date.now() / 1000),
  };
}

/**
 * Returns a frozen snapshot once the ceremony reaches `glowing`.
 * Until then, returns `null` — the keepsake CTA should stay hidden.
 */
export function useThreadSnapshot(inputs: SnapshotInputs): ThreadSnapshot | null {
  const { phase } = useCeremony();
  const { score } = useThermal();
  const { maxDepth } = useScrollDepth();
  const [frozen, setFrozen] = useState<ThreadSnapshot | null>(null);
  const { slug, title, archetype } = inputs;

  useEffect(() => {
    if (frozen) return;                    // already captured — stay still
    if (!isCeremonyFrozen(phase)) return;  // wait for ceremony
    setFrozen(buildSnapshot({ slug, title, archetype }, maxDepth, score));
  }, [phase, frozen, slug, title, archetype, maxDepth, score]);

  // Reset when navigating to a new article — prevents carryover.
  useEffect(() => { setFrozen(null); }, [slug]);

  return frozen;
}

/** Manual capture — useful when an older ceremony already settled. */
export function captureThreadSnapshot(
  inputs: SnapshotInputs,
  depth: number,
  score: number,
): ThreadSnapshot {
  return buildSnapshot(inputs, depth, score);
}
