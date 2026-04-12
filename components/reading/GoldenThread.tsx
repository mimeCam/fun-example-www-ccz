'use client';

import { useEffect, useState } from 'react';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';

/**
 * GoldenThread — vertical reading spine on the left edge.
 *
 * Replaces the horizontal DepthBar. Climbs as the reader descends.
 * Color shifts violet→gold via --token-accent (thermal interpolation).
 * Glow pulses at stirring+ thermal state, gated by data-thermal CSS selectors.
 *
 * Phases: hidden → active → settled → fading
 *   hidden:  not reading yet
 *   active:  reading, thread tracks scroll depth
 *   settled: finished reading, hold for 2s
 *   fading:  settle complete, thin gold line at 0.3 opacity
 */
type Phase = 'hidden' | 'active' | 'settled' | 'fading';

/** Time to hold at 'settled' before fading (matches --sys-time-linger: 1000ms + visual buffer). */
const T_LINGER = 2000;

export function GoldenThread() {
  const { depth, isReading, isFinished } = useScrollDepth();
  const [phase, setPhase] = useState<Phase>('hidden');

  useEffect(() => {
    if (isReading && !isFinished && phase === 'hidden') setPhase('active');
  }, [isReading, isFinished, phase]);

  useEffect(() => {
    if (!isFinished || phase !== 'active') return;
    setPhase('settled');
    const t = setTimeout(() => setPhase('fading'), T_LINGER);
    return () => clearTimeout(t);
  }, [isFinished, phase]);

  if (phase === 'hidden') return null;

  return (
    <div
      className="fixed top-0 bottom-0 left-sys-2 z-10 pointer-events-none"
      role="progressbar"
      aria-label={`Reading progress: ${Math.round(depth)}%`}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(depth)}
    >
      {/* Track — faint background line */}
      <div className="absolute inset-y-0 left-0 w-[2px] bg-fog/20 rounded-sys-full" />
      {/* Fill — climbs with scroll, thermal color + glow */}
      <div
        className="absolute top-0 left-0 w-[2px] rounded-sys-full golden-thread-glow"
        style={{
          height: `${depth}%`,
          backgroundColor: 'var(--token-accent)',
          opacity: phase === 'fading' ? 0.3 : 1,
          transition: 'height 300ms var(--sys-ease-out), opacity 1.5s ease-out',
        }}
      />
    </div>
  );
}
