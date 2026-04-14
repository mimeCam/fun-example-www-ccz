/**
 * GoldenThread — vertical reading spine on the left edge.
 *
 * Climbs as the reader descends. Color shifts violet→gold via
 * --token-accent (thermal interpolation). Glow pulses at stirring+
 * thermal state, gated by data-thermal CSS selectors.
 *
 * Phases: hidden → active → settled → fading
 * Ceremony-aware: listens to CeremonySequencer for choreographed glow.
 */

'use client';

import { useEffect, useState } from 'react';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';
import { useCeremony } from './CeremonySequencer';

type Phase = 'hidden' | 'active' | 'settled' | 'fading';

/** Time to hold at 'settled' before fading (matches ceremony timing). */
const T_LINGER = 2000;

export function GoldenThread() {
  const { depth, isReading, isFinished } = useScrollDepth();
  const { phase: ceremonyPhase } = useCeremony();
  const [phase, setPhase] = useState<Phase>('hidden');

  // Enter active when reading begins
  useEffect(() => {
    if (isReading && !isFinished && phase === 'hidden') setPhase('active');
  }, [isReading, isFinished, phase]);

  // Enter settled when ceremony reaches glowing phase (or isFinished as fallback)
  useEffect(() => {
    if (phase !== 'active') return;
    if (ceremonyPhase === 'glowing' || ceremonyPhase === 'warming' || ceremonyPhase === 'gifting' || ceremonyPhase === 'settled') {
      setPhase('settled');
      const t = setTimeout(() => setPhase('fading'), T_LINGER);
      return () => clearTimeout(t);
    }
    // Fallback: if isFinished fires without ceremony (edge case)
    if (isFinished) {
      setPhase('settled');
      const t = setTimeout(() => setPhase('fading'), T_LINGER);
      return () => clearTimeout(t);
    }
  }, [ceremonyPhase, isFinished, phase]);

  if (phase === 'hidden') return null;

  const isSettled = phase === 'settled';

  return (
    <div
      className="fixed top-0 bottom-0 left-[var(--sys-thread-offset)] z-sys-thread pointer-events-none"
      role="progressbar"
      aria-label={`Reading progress: ${Math.round(depth)}%`}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(depth)}
    >
      {/* Track — fog/30 for dormant visibility */}
      <div className="absolute inset-y-0 left-0 w-[var(--sys-thread-width)] bg-fog/30 rounded-sys-full" />
      {/* Fill — climbs with scroll, thermal color + glow */}
      <div
        className={`absolute top-0 left-0 w-[var(--sys-thread-width)] rounded-sys-full golden-thread-glow ${isSettled ? 'golden-thread-settled' : ''}`}
        style={{
          height: `${depth}%`,
          backgroundColor: 'var(--token-accent)',
          opacity: phase === 'fading' ? 0.3 : 1,
          transition: 'height var(--sys-time-enter) var(--sys-ease-out), opacity var(--sys-time-settle) var(--sys-ease-out)',
        }}
      />
    </div>
  );
}
