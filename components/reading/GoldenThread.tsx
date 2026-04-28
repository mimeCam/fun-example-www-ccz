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
 * Continuity contract (Mike K. napkin #18 + Tanya UIX #44 §4):
 *   - The spine is **always mounted**; visibility is opacity-gated via
 *     `presenceClassOf` from `lib/design/presence.ts` — same shape as
 *     `AmbientNav` and `NextRead`. The previous `if (phase === 'hidden')
 *     return null` violated the chrome-rhythm continuity contract (the
 *     dried ink would vanish mid-glance). The new path: hidden → 'gone',
 *     active/fading → 'attentive', settled → 'gifted'. Motion endpoint
 *     literals live in the helper, not here.
 *   - The wrapper cross-fade rides `crossfade-inline` (120 ms ease-out) —
 *     the same verb AmbientNav and NextRead already share.
 *   - `aria-hidden` (via `presenceAriaHidden`) keeps the dormant spine off
 *     the accessibility tree without unmounting; ARIA `valuenow` carries
 *     the maxDepth across the gone state so the dried ink remembers where
 *     the reader was, even at α=0.
 *
 * Credits: Mike K. (napkin — tide mark semantics, crossing event pattern;
 *          #18 — three-member presence helper, ALPHA carve-out path),
 *          Tanya D. (UIX spec §1 — tide mark identity, breathing spec;
 *          UIX #44 — chrome-rhythm continuity contract, six-frame story-
 *          board for the still-there moment).
 */

'use client';

import { useEffect, useState } from 'react';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';
import { useThreadDepth } from '@/lib/hooks/useThreadDepth';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { CEREMONY, MOTION } from '@/lib/design/motion';
import { alphaClassOf } from '@/lib/design/alpha';
import { gestureClassesForMotion, gestureClassesOf } from '@/lib/design/gestures';
import {
  presenceClassOf,
  presenceAriaHidden,
  type Presence,
} from '@/lib/design/presence';
import { onCrossing, type ThermalStateCrossing } from '@/lib/thermal/state-crossing';
import { peek } from '@/lib/thread/thread-driver';
import { TIDE_CROSSING_EVENT } from '@/lib/thread/thread-tide';
import { useCeremony } from './CeremonySequencer';

type Phase = 'hidden' | 'active' | 'settled' | 'fading';

/** Ceremony phases that trigger the settled burst. */
const SETTLED_PHASES = new Set(['warming', 'gifting', 'settled']);

/* ─── Wrapper crossfade verb — same baton AmbientNav rides on its chassis ──
   `crossfade-inline` (120 ms, ease-out): "one label replacing another —
   instant enough that I don't see the seam." Module-scope binding so the
   gesture-call-site fence reads the literal at the source level. The
   chrome-rhythm continuity contract (Tanya UIX #44 §3 F5) names this verb
   for the spine's `gone → attentive` first scroll cross-fade. */
const PRESENCE_GESTURE = gestureClassesOf('crossfade-inline');

/**
 * Map a Phase to the wrapper-level Presence rung. Pure, ≤ 10 LOC.
 *
 *   hidden  → 'gone'      — dormant; motion-α-0 fade endpoint, no clicks.
 *   active  → 'attentive' — reader is engaged; motion-α-1 fade endpoint.
 *   settled → 'gifted'    — completion ceremony beat at motion-α-1; fill
 *                           paints the one-shot `golden-thread-settled`
 *                           burst (component-local, not wrapper).
 *   fading  → 'attentive' — fill recedes to the Alpha `muted` rung
 *                           inside the still-visible wrapper.
 */
function presenceFor(phase: Phase): Presence {
  if (phase === 'hidden')  return 'gone';
  if (phase === 'settled') return 'gifted';
  return 'attentive';
}

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

  // Always mount; gate visibility via opacity. The dried-ink metaphor is
  // legible across the dormant state — the spine remembers, the eye doesn't
  // see it (yet). Tanya UIX #44 §3, Mike #18 §2.1.
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
 *
 * Motion contract (Mike #62, Tanya UIX #23): the fill's opacity+width fade
 * rides the Gesture Atlas verb `thread-settle` via `gestureClassesForMotion`.
 * Reduced-motion is honored at the seam — no inline timing/easing tokens
 * on this surface. The `style={{...}}` block carries only dynamic CSS-var
 * carriers (height, backgroundColor) — those are driver-owned and outside
 * the Atlas's scope.
 *
 * Continuity contract (Mike #18, Tanya UIX #44 §4):
 *   The wrapper is always mounted; its opacity rides the
 *   `crossfade-inline` verb (120 ms ease-out) gated by `presenceClassOf`.
 *   `aria-hidden="true"` and `pointer-events-none` (from the `gone`
 *   presence) keep the dormant spine off the accessibility tree and out
 *   of click-target geometry without unmounting the role/valuenow pair —
 *   the dried ink remembers across α=0.
 */
function ThreadSpine({ phase, crossingClass, tidePulseClass }: SpineProps) {
  const reduce = useReducedMotion();
  const maxDepthPct = Math.round(peek().maxDepth * 100);
  const fadeMotion = gestureClassesForMotion('thread-settle', reduce);
  const presence = presenceFor(phase);
  return (
    <div
      className={wrapperClass(presence)}
      role="progressbar"
      aria-label="Furthest reading depth"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={maxDepthPct}
      aria-hidden={presenceAriaHidden(presence)}
    >
      {/* Track — dormant chrome. Alpha rung `muted` via ledger helper. */}
      <div
        className={`absolute inset-y-0 left-0 w-[var(--sys-thread-width)] ${alphaClassOf('fog', 'muted')} rounded-sys-full golden-thread-track`}
      />
      {/* Fill — tide mark; height = var(--thread-depth) = smoothed maxDepth.
          golden-thread-fill: width-step at warm+ thermal.
          crossingClass:      thermal threshold pulse.
          tidePulseClass:     new-max-depth pulse at 25/50/75/100% bands.
          fadeMotion:         Atlas-owned `thread-settle` curve on opacity+width.
          Breathing animation (tide-breathe) gated by data-thread-settled on <html>. */}
      <div
        className={`${fillClassName(phase)} ${crossingClass} ${tidePulseClass} transition-[opacity,width] ${fadeMotion}`}
        style={{
          height: 'calc(var(--thread-depth, 0) * 100%)',
          backgroundColor: 'var(--token-accent)',
        }}
      />
    </div>
  );
}

/**
 * Compose the wrapper className from a presence rung. Pure, ≤ 10 LOC.
 *
 * The wrapper carries the spine's geometry (fixed-position, full-height,
 * gutter-anchored) plus the presence cross-fade lattice:
 *
 *   • `pointer-events-none` baseline — the spine is decorative chrome
 *     (Tanya UIX #44 §6); the `gone` presence's own pointer-events-none
 *     is idempotent on this surface, kept for parity with sibling chrome.
 *   • `transition-opacity` — the property the cross-fade animates.
 *   • `crossfade-inline` verb — 120 ms ease-out, the sibling chrome
 *     surfaces' continuity baton (AmbientNav.tsx, NextRead.tsx).
 *   • `presenceClassOf(presence)` — the endpoint pair (opacity + ARIA-
 *     reachability), one home in `lib/design/presence.ts`.
 */
function wrapperClass(presence: Presence): string {
  return [
    'fixed top-0 bottom-0 left-[var(--sys-thread-offset)] z-sys-thread',
    'pointer-events-none transition-opacity',
    PRESENCE_GESTURE,
    presenceClassOf(presence),
  ].join(' ');
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
