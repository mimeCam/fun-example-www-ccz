/**
 * StateCrossingFlash — left-edge bloom on thermal state crossing.
 *
 * A 600ms screen-edge wipe that fires once per forward crossing.
 * Fixed position, pointer-events: none — never interferes with reading.
 *
 * Reduced-motion: the bloom keyframe fires at opacity 0 (invisible).
 * Color still lands via the GoldenThread's crossing pulse. Non-negotiable.
 *
 * Quiet-zone guard: this component is only mounted on the article page.
 * The /trust page never mounts it — crossing ceremonies don't fire there.
 *
 * Architecture: subscribes to STATE_CROSSING_EVENT window event bus.
 * Same pattern as THRESHOLD_OPENING_EVENT in lib/hooks/useThreshold.ts.
 *
 * Credits: Mike K. (StateCrossingFlash spec — fixed bloom, 600ms, left origin),
 * Tanya D. (§3 threshold moment specs — bloom from left, gold axis).
 */

'use client';

import { useEffect, useState } from 'react';
import { onCrossing, type ThermalStateCrossing } from '@/lib/thermal/state-crossing';
import { CEREMONY } from '@/lib/design/motion';

type FlashState = (ThermalStateCrossing & { key: number }) | null;

/** Manages crossing flash state — auto-clears after CEREMONY.crossing ms. */
function useCrossingFlash(): FlashState {
  const [flash, setFlash] = useState<FlashState>(null);
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let seq = 0;
    const off = onCrossing((c: ThermalStateCrossing) => {
      if (timerId) clearTimeout(timerId);
      setFlash({ ...c, key: ++seq });
      timerId = setTimeout(() => setFlash(null), CEREMONY.crossing);
    });
    return () => { off(); if (timerId) clearTimeout(timerId); };
  }, []);
  return flash;
}

/**
 * Coda-overlay guard: the in-component `phase === 'gifting'` check used
 * to live here. It's now redundant — `onCrossing()` itself drops payloads
 * while `useCeremonyQuiet()` is true (subscription-side gate, see
 * `lib/thermal/state-crossing.ts` and `lib/ceremony/quiet-store.ts`).
 * The flash never observes a crossing during the keepsake reveal, so
 * there is nothing to render-time-suppress here. (Mike §6.3 / Tanya §5.)
 */
export function StateCrossingFlash() {
  const flash = useCrossingFlash();
  if (!flash) return null;
  return <CrossingBloom key={flash.key} intensity={flash.intensity} />;
}

// ─── Sub-component ───────────────────────────────────────────────────────────

interface BloomProps {
  intensity: ThermalStateCrossing['intensity'];
}

/**
 * The bloom itself — a fixed full-screen overlay that wipes right from
 * the left edge (same axis as GoldenThread). Visual family coherence.
 */
function CrossingBloom({ intensity }: BloomProps) {
  return (
    <div
      aria-hidden="true"
      className={`crossing-flash crossing-flash--${intensity}`}
    />
  );
}
