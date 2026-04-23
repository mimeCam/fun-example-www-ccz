/**
 * GoldenThread — vertical reading spine on the left edge.
 *
 * Climbs as the reader descends. Color shifts violet→gold via
 * --token-accent (thermal interpolation). Glow pulses at stirring+
 * thermal state, gated by data-thermal CSS selectors.
 *
 * Phases: hidden → active → settled → fading
 * Ceremony-aware: listens to CeremonySequencer for choreographed glow.
 *
 * Ledger adoption (Mike K. napkin #38 + Tanya D. UIX spec #69):
 *   - settled→fading dwell rides `CEREMONY.glowHold` — the SAME beat as
 *     the keepsake halo, so Thread burst and Keepsake bloom breathe in
 *     lockstep when the reader finishes a passage.
 *   - fading recedes to `opacity-muted` (ALPHA rung `muted` = 0.30) —
 *     "ambient chrome, skip past it." Track and fill quote the same rung.
 *
 * ThreadDriver adoption (Mike K. napkin #5 — ThreadPulse):
 *   - Fill height is no longer a React prop. `useThreadDepth()` installs
 *     the shared RAF-driven driver; the fill reads `--thread-depth` via
 *     `calc(var(--thread-depth, 0) * 100%)`. React renders this element
 *     once; the driver writes the variable sub-pixel on its own cadence.
 *   - CSS `transition: height` is gone — the driver owns motion now.
 *     One source of truth, no 5% pops on long-form posts.
 *   - `useScrollDepth` still owns `isReading` / `isFinished` gating and
 *     feeds aria-valuenow (coarse 5% is fine for screen readers).
 */

'use client';

import { useEffect, useState } from 'react';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';
import { useThreadDepth } from '@/lib/hooks/useThreadDepth';
import { CEREMONY } from '@/lib/design/motion';
import { alphaClassOf } from '@/lib/design/alpha';
import { useCeremony } from './CeremonySequencer';

type Phase = 'hidden' | 'active' | 'settled' | 'fading';

/** Ceremony phases that trigger the settled burst. */
const SETTLED_PHASES = new Set(['glowing', 'warming', 'gifting', 'settled']);

export function GoldenThread() {
  const { depth, isReading, isFinished } = useScrollDepth();
  const { phase: ceremonyPhase } = useCeremony();
  const [phase, setPhase] = useState<Phase>('hidden');

  // Install the shared RAF-driven depth driver (see lib/thread/).
  // The driver writes --thread-depth on documentElement; the fill reads it.
  useThreadDepth();

  // Enter active when reading begins.
  useEffect(() => {
    if (isReading && !isFinished && phase === 'hidden') setPhase('active');
  }, [isReading, isFinished, phase]);

  // Enter settled when ceremony ignites (fallback: isFinished without ceremony).
  useEffect(() => {
    if (phase !== 'active') return;
    if (!SETTLED_PHASES.has(ceremonyPhase) && !isFinished) return;
    setPhase('settled');
    const t = setTimeout(() => setPhase('fading'), CEREMONY.glowHold);
    return () => clearTimeout(t);
  }, [ceremonyPhase, isFinished, phase]);

  if (phase === 'hidden') return null;

  return (
    <div
      className="fixed top-0 bottom-0 left-[var(--sys-thread-offset)] z-sys-thread pointer-events-none"
      role="progressbar"
      aria-label={`Reading progress: ${Math.round(depth)}%`}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(depth)}
    >
      {/* Track — dormant chrome. Alpha rung `muted` via the ledger helper;
          same string emitted as before ("bg-fog/30"), now routed through
          the single source of truth. Fill's fading posture reads the same
          rung below. */}
      <div className={`absolute inset-y-0 left-0 w-[var(--sys-thread-width)] ${alphaClassOf('fog', 'muted')} rounded-sys-full golden-thread-track`} />
      {/* Fill — climbs with scroll, thermal color + glow, golden-thread-fill
          for width step. Fading recedes via Alpha ledger `muted` rung.
          Height is driven by --thread-depth (ThreadDriver), not React state. */}
      <div
        className={fillClassName(phase)}
        style={{
          height: 'calc(var(--thread-depth, 0) * 100%)',
          backgroundColor: 'var(--token-accent)',
          transition: 'opacity var(--sys-time-settle) var(--sys-ease-out), width var(--sys-time-settle) var(--sys-ease-out)',
        }}
      />
    </div>
  );
}

/**
 * Compose the fill className from phase. Pure, ≤ 10 LOC.
 *   - `golden-thread-glow`  → thermal-gated base glow (always on fill)
 *   - `golden-thread-fill`  → width-step marker at warm+ thermal
 *   - `golden-thread-settled` → one-shot completion burst
 *   - `opacity-muted`        → Alpha ledger rung for the fading posture
 */
function fillClassName(phase: Phase): string {
  const base =
    'absolute top-0 left-0 w-[var(--sys-thread-width)] rounded-sys-full' +
    ' golden-thread-glow golden-thread-fill';
  if (phase === 'settled') return `${base} golden-thread-settled`;
  if (phase === 'fading')  return `${base} opacity-muted`;
  return base;
}
