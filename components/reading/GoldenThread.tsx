/**
 * GoldenThread — vertical reading spine on the left edge.
 *
 * The fill is a tide mark — it climbs as the reader descends and NEVER
 * retreats. When the reader scrolls back up, the fill holds at its highest
 * point and breathes (CSS `tide-breathe` keyframe, gated by
 * `data-thread-settled` on <html>). This is the "dried ink" metaphor:
 * the thread records the high-water mark, not the cursor position.
 *
 * Color shifts violet→gold via --token-accent (thermal interpolation).
 * Glow pulses at stirring+ thermal state, gated by data-thermal selectors.
 *
 * Phases: hidden → active → settled → fading
 * Ceremony-aware: listens to CeremonySequencer for choreographed glow.
 * Crossing-aware:
 *   - STATE_CROSSING_EVENT → thermal threshold pulse (existing)
 *   - TIDE_CROSSING_EVENT  → new-max-depth pulse at 25/50/75/100%
 *
 * ARIA: reports `maxDepth` (furthest point reached), not raw scroll.
 *   role="progressbar" aria-label="Furthest reading depth"
 *   aria-valuenow = maxDepth × 100 (0–100)
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
 * Credits: Mike K. (napkin — tide mark semantics, crossing event pattern),
 *          Tanya D. (UIX spec §1 — tide mark identity, breathing spec).
 */

'use client';

import { useEffect, useState } from 'react';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';
import { useThreadDepth } from '@/lib/hooks/useThreadDepth';
import { CEREMONY, MOTION } from '@/lib/design/motion';
import { alphaClassOf } from '@/lib/design/alpha';
import { onCrossing, type ThermalStateCrossing } from '@/lib/thermal/state-crossing';
import { peek } from '@/lib/thread/thread-driver';
import { TIDE_CROSSING_EVENT } from '@/lib/thread/thread-tide';
import { useCeremony } from './CeremonySequencer';

type Phase = 'hidden' | 'active' | 'settled' | 'fading';

/** Ceremony phases that trigger the settled burst. */
const SETTLED_PHASES = new Set(['warming', 'gifting', 'settled']);

/** Manages thermal crossing pulse class — clears after CEREMONY.crossing ms. */
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

/**
 * Manages tide mark crossing pulse — fires when reader reaches a new
 * depth milestone (25/50/75/100%). One breath at `whisper` glow level
 * (300ms). Complements the thermal crossing without colliding with it.
 */
function useTidePulse(): string {
  const [cls, setCls] = useState('');
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    const handler = () => {
      if (timerId) clearTimeout(timerId);
      setCls('golden-thread-tide-pulse');
      timerId = setTimeout(() => setCls(''), MOTION.enter);
    };
    window.addEventListener(TIDE_CROSSING_EVENT, handler);
    return () => { window.removeEventListener(TIDE_CROSSING_EVENT, handler); if (timerId) clearTimeout(timerId); };
  }, []);
  return cls;
}

export function GoldenThread() {
  const { isReading, isFinished } = useScrollDepth();
  const { phase: ceremonyPhase } = useCeremony();
  const [phase, setPhase] = useState<Phase>('hidden');
  const crossingClass = useCrossingPulse();
  const tidePulseClass = useTidePulse();

  // Install shared RAF-driven depth driver (lib/thread/).
  // Writes --thread-depth, --thread-tide-delta, --thread-is-settled
  // + data-thread-settled on documentElement; fill reads from them.
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
    <ThreadSpine
      phase={phase}
      crossingClass={crossingClass}
      tidePulseClass={tidePulseClass}
    />
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface SpineProps {
  phase: Phase;
  crossingClass: string;
  tidePulseClass: string;
}

/**
 * Renders the track + fill spine. Extracted to keep GoldenThread ≤ 10 LOC.
 * ARIA reports maxDepth (furthest point reached) via peek() — a synchronous
 * read at render time. Screen readers announce on focus; 60fps updates not needed.
 */
function ThreadSpine({ phase, crossingClass, tidePulseClass }: SpineProps) {
  const maxDepthPct = Math.round(peek().maxDepth * 100);
  return (
    <div
      className="fixed top-0 bottom-0 left-[var(--sys-thread-offset)] z-sys-thread pointer-events-none"
      role="progressbar"
      aria-label="Furthest reading depth"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={maxDepthPct}
    >
      {/* Track — dormant chrome. Alpha rung `muted` via ledger helper. */}
      <div
        className={`absolute inset-y-0 left-0 w-[var(--sys-thread-width)] ${alphaClassOf('fog', 'muted')} rounded-sys-full golden-thread-track`}
      />
      {/* Fill — tide mark; height = var(--thread-depth) = smoothed maxDepth.
          golden-thread-fill: width-step at warm+ thermal.
          crossingClass:      thermal threshold pulse.
          tidePulseClass:     new-max-depth pulse at 25/50/75/100% bands.
          Breathing animation (tide-breathe) gated by data-thread-settled on <html>. */}
      <div
        className={`${fillClassName(phase)} ${crossingClass} ${tidePulseClass}`}
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
  if (phase === 'fading') return `${base} opacity-muted`;
  return base;
}
