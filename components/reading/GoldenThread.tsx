/**
 * GoldenThread — vertical reading spine on the left edge.
 *
 * Climbs as the reader descends. Color shifts violet→gold via
 * --token-accent (thermal interpolation). Glow pulses at stirring+
 * thermal state, gated by data-thermal CSS selectors.
 *
 * Phases: hidden → active → settled → fading
 * Ceremony-aware: listens to CeremonySequencer for choreographed glow.
 * Crossing-aware: subscribes to STATE_CROSSING_EVENT for per-threshold pulse.
 *
 * Ledger adoption (Mike K. napkin #38 + Tanya D. UIX spec #69):
 *   - settled→fading dwell rides `CEREMONY.glowHold` — same beat as keepsake halo.
 *   - fading recedes to `opacity-muted` (ALPHA rung `muted` = 0.30).
 *
 * ThreadDriver adoption (Mike K. napkin #5 — ThreadPulse):
 *   - Fill height driven by RAF via `useThreadDepth()` writing `--thread-depth`.
 *   - React renders once; the driver owns sub-pixel motion.
 *   - CSS `transition: height` is gone — driver owns motion, one source of truth.
 *
 * Credits: Mike K. (crossing pulse — state-crossing napkin), Tanya D. (UIX
 * spec §6 Thread companion spec — width/glow/pulse language per state).
 */

'use client';

import { useEffect, useState } from 'react';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';
import { useThreadDepth } from '@/lib/hooks/useThreadDepth';
import { CEREMONY } from '@/lib/design/motion';
import { alphaClassOf } from '@/lib/design/alpha';
import { onCrossing, type ThermalStateCrossing } from '@/lib/thermal/state-crossing';
import { useCeremony } from './CeremonySequencer';

type Phase = 'hidden' | 'active' | 'settled' | 'fading';

/** Ceremony phases that trigger the settled burst. */
const SETTLED_PHASES = new Set(['warming', 'gifting', 'settled']);

/** Manages crossing pulse class — clears after CEREMONY.crossing ms. */
function useCrossingPulse(): string {
  const [cls, setCls] = useState('');
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    const off = onCrossing((c: ThermalStateCrossing) => {
      if (timerId) clearTimeout(timerId);
      setCls(`golden-thread-crossing golden-thread-crossing--${c.intensity}`);
      timerId = setTimeout(() => setCls(''), CEREMONY.crossing);
    });
    return () => { off(); if (timerId) clearTimeout(timerId); };
  }, []);
  return cls;
}

export function GoldenThread() {
  const { depth, isReading, isFinished } = useScrollDepth();
  const { phase: ceremonyPhase } = useCeremony();
  const [phase, setPhase] = useState<Phase>('hidden');
  const crossingClass = useCrossingPulse();

  // Install shared RAF-driven depth driver (lib/thread/).
  // Writes --thread-depth on documentElement; fill reads it.
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
  return <ThreadSpine depth={depth} phase={phase} crossingClass={crossingClass} />;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface SpineProps {
  depth: number;
  phase: Phase;
  crossingClass: string;
}

/** Renders the track + fill spine. Extracted to keep GoldenThread ≤ 10 LOC. */
function ThreadSpine({ depth, phase, crossingClass }: SpineProps) {
  return (
    <div
      className="fixed top-0 bottom-0 left-[var(--sys-thread-offset)] z-sys-thread pointer-events-none"
      role="progressbar"
      aria-label={`Reading progress: ${Math.round(depth)}%`}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(depth)}
    >
      {/* Track — dormant chrome. Alpha rung `muted` via ledger helper. */}
      <div className={`absolute inset-y-0 left-0 w-[var(--sys-thread-width)] ${alphaClassOf('fog', 'muted')} rounded-sys-full golden-thread-track`} />
      {/* Fill — climbs with scroll, thermal color + glow.
          golden-thread-fill: width-step marker at warm+ thermal.
          crossingClass: brief pulse on each threshold crossing. */}
      <div
        className={`${fillClassName(phase)} ${crossingClass}`}
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
 * Compose fill className from phase. Pure, ≤ 10 LOC.
 *   golden-thread-glow    — thermal-gated base glow (always on fill)
 *   golden-thread-fill    — width-step marker at warm+ thermal
 *   golden-thread-settled — one-shot completion burst
 *   opacity-muted         — Alpha ledger rung for the fading posture
 */
function fillClassName(phase: Phase): string {
  const base =
    'absolute top-0 left-0 w-[var(--sys-thread-width)] rounded-sys-full' +
    ' golden-thread-glow golden-thread-fill';
  if (phase === 'settled') return `${base} golden-thread-settled`;
  if (phase === 'fading')  return `${base} opacity-muted`;
  return base;
}
