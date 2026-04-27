/**
 * Recognition Timeline — temporal source of truth for the Return
 * Recognition Moment.
 *
 * Sibling module to `recognition-surface.ts` (the *spatial* selector):
 * that module names *which* surface paints; this module names *when*,
 * *how long*, and *with what silence between beats*. Same pure-function
 * discipline; same closed-union exhaustiveness; same `*Plan()` factory
 * idiom borrowed verbatim from `lib/thermal/transition-choreography.ts`.
 *
 * Until this module landed, three surfaces (`ReturnLetter`,
 * `RecognitionWhisper`, `ViaWhisper`) hand-rolled their own `setTimeout`
 * cascades against ad-hoc constants. The drift was prose-only — the rule
 * "calibrate the silences like a piano sustain pedal" lived in reviewer
 * memory. This module promotes the rule to a typed module, sibling to
 * `voice-ledger.ts`, `motion.ts`, and `transition-choreography.ts`.
 *
 * Pure, stateless, SSR-safe. No React, no `window`, no `setTimeout`.
 * Every numeric value is a composition of `MOTION` / `CEREMONY` tokens
 * already declared in `lib/design/motion.ts` — no literal milliseconds
 * are introduced here. The hook (`useRecognitionPhase`) is the runtime
 * adapter that fans this data out into a `phase` state machine.
 *
 * Phase progression — five-state state machine, walked once per mount:
 *
 *   T = 0                                                      → 'rest'
 *   T = liftMs                                                 → 'lift'
 *   T = liftMs + settleMs                                      → 'settle'
 *   T = liftMs + settleMs + holdMs                             → 'hold'
 *   T = liftMs + settleMs + holdMs + foldMs                    → 'fold'
 *
 * Each `*Ms` field is the duration *spent in the PRIOR phase* before
 * transitioning to the named one. So `liftMs` is the time spent at
 * 'rest' before lifting; `settleMs` is the time spent in 'lift'
 * before settling; `holdMs` is the time the surface dwells at its
 * alpha rung in 'settle' (the perceived dwell); `foldMs` is the time
 * spent in 'hold' (the silence after the dwell) before retiring.
 *
 * Surfaces consume `phase` and map it to their own paint rungs (e.g.
 * `'rest'` → `opacity-0`, `'settle'` → `opacity-100 + shadow-bloom`).
 * The mapping lives at the call site; the *timing* lives here.
 *
 * Credits:
 *   • Mike Koch (architect, napkin §"Module shape" — typed plan, pure
 *     resolver, named factories matched 1:1 to RecognitionSurface, the
 *     `holdMs ≤ MOTION.settle * 8` invariant, the silence-perceptibility
 *     fence, the rule-of-three cap on named factories).
 *   • Tanya Donska (UIX §4.2 "first 3 seconds, frame by frame" — the
 *     50 ms / 1200 ms / 8000 ms anchors transcribed verbatim into the
 *     letter and whisper plans below).
 *   • The unnamed engineers behind `lib/design/motion.ts`,
 *     `lib/return/recognition-surface.ts`, and
 *     `lib/thermal/transition-choreography.ts` — every shape here is a
 *     composition of those three modules.
 */

import { MOTION, MOTION_REDUCED_MS, CEREMONY, type MotionEase } from '@/lib/design/motion';
import type { RecognitionSurface } from '@/lib/return/recognition-surface';
import type { ThermalState } from '@/lib/thermal/thermal-score';
import { recognitionTempo, type TempoMod } from '@/lib/return/recognition-tempo';

// ─── Phase vocabulary — closed union, exhaustive over the state machine ────

/**
 * Five named phases. Adding a phase without populating every named
 * timeline factory is a TypeScript error. That is the fence — the same
 * exhaustiveness pattern `voice-ledger.ts` uses for `Surface`.
 *
 *   `rest`   — pre-mount; the room is unaware (also: post-fold idle).
 *   `lift`   — the cue arrives (opacity 0 → muted; transitioning).
 *   `settle` — the cue dwells at its alpha rung (the visible "talking").
 *   `hold`   — sustained quiet — the silence after the dwell.
 *   `fold`   — the cue retires (opacity → recede or 0).
 */
export type RecognitionPhase = 'rest' | 'lift' | 'settle' | 'hold' | 'fold';

/** All five phases as a tuple — ordered by chronological progression. */
export const RECOGNITION_PHASES: readonly RecognitionPhase[] = [
  'rest', 'lift', 'settle', 'hold', 'fold',
] as const;

// ─── Plan shape — same idiom as `TransitionPlan` in transition-choreography ─

/**
 * Typed timeline. Each `*Ms` field is the duration spent in the prior
 * phase before transitioning. See module docblock for the cumulative
 * milestone formula.
 */
export interface RecognitionTimeline {
  /** ms spent at 'rest' before phase becomes 'lift'. */
  readonly liftMs: number;
  /** ms spent at 'lift' before phase becomes 'settle'. */
  readonly settleMs: number;
  /** ms spent at 'settle' before phase becomes 'hold' (the dwell). */
  readonly holdMs: number;
  /** ms spent at 'hold' before phase becomes 'fold' (the silence). */
  readonly foldMs: number;
  /** Easing curve the surface applies to its own CSS transitions. */
  readonly ease: MotionEase;
}

// ─── Reduced-motion floor — every duration collapses to one frame ──────────

/** All-floor timeline — every duration === MOTION_REDUCED_MS. Pure. */
function reducedTimeline(ease: MotionEase): RecognitionTimeline {
  return {
    liftMs:   MOTION_REDUCED_MS,
    settleMs: MOTION_REDUCED_MS,
    holdMs:   MOTION_REDUCED_MS,
    foldMs:   MOTION_REDUCED_MS,
    ease,
  };
}

// ─── Named plans — one per RecognitionSurface (rule-of-three cap) ──────────
//
// No literal milliseconds. Every value composes from MOTION / CEREMONY
// tokens already declared in `lib/design/motion.ts`. A future re-tune
// happens at one address.

/**
 * Letter plan — verbatim transcription of the existing ReturnLetter
 * cascade (Tanya UX §4.2 "first 3 seconds, frame by frame"):
 *
 *   T=0 → opacity-0 (the room is alive but not addressing anyone yet)
 *   T=50ms → approach → settle (BORDER_HAIRLINE arrives; bloom lifts)
 *   T=1200ms → rest (settled; dismiss + actions interactive)
 *
 * The letter does not auto-fold (the bloom holds until the reader
 * dismisses); `foldMs = 0` and `holdMs` is capped at the invariant
 * ceiling so the dwell is bounded but effectively perpetual on the page.
 */
export function letterTimeline(): RecognitionTimeline {
  return {
    liftMs:   MOTION_REDUCED_MS * 5,                              // 50
    settleMs: MOTION.linger + MOTION.hover - MOTION_REDUCED_MS * 5, // 1150
    holdMs:   MOTION.settle * 8,                                  // 12000
    foldMs:   0,
    ease:     'out',
  };
}

/**
 * Whisper plan — the recognition silence that holds for eight `linger`
 * breaths before the cue retires to muted. Existing constants this
 * collapses (Mike napkin §"Surgical adoption"):
 *
 *   • RecognitionWhisper.WHISPER_SETTLE_MS = MOTION.linger * 8 (8000ms)
 *   • ViaWhisper.T_LINGER (was 6000ms — re-canonicalised to 8s here so
 *     every recognition voice across the site speaks the same dwell).
 *
 * `liftMs` is the time the room takes before greeting the reader. The
 * kernel owns it; both whisper surfaces (`RecognitionWhisper`, `ViaWhisper`)
 * inherit it. All five phase durations are owned by `whisperTimeline()`.
 */
export function whisperTimeline(): RecognitionTimeline {
  return {
    liftMs:   MOTION.settle,            // 1500 — the breath before greeting
    settleMs: 0,
    holdMs:   MOTION.linger * 8,        // 8000 — the canonical recognition dwell
    foldMs:   MOTION.settle,            // 1500 — gentle retirement
    ease:     'sustain',
  };
}

/** Silent plan — no cue paints; every duration is zero. Pure no-op. */
export function silentTimeline(): RecognitionTimeline {
  return { liftMs: 0, settleMs: 0, holdMs: 0, foldMs: 0, ease: 'sustain' };
}

// ─── Resolver — same idiom as pickRecognitionSurface ───────────────────────

/**
 * Pick the active timeline for a surface and motion preferences. Pure.
 *
 * Closed-union exhaustive switch — adding a `RecognitionSurface` member
 * without a case here is a TypeScript error (`never` falls through).
 *
 * `prefs.thermal` is the Recognition-Cadence input (Mike napkin
 * §"Module shape" — narrowest viable cut). When present and motion is
 * not reduced, `recognitionTempo(thermal)` modulates the *approach*
 * (`liftMs` and `settleMs`) and may override the `ease`. When absent,
 * behaviour is byte-identical to today (the optional field defaults to
 * `undefined` for every existing caller). Reduced motion always wins —
 * the floor short-circuits before tempo is consulted (Tanya §3, Mike
 * POI-2).
 */
export function resolveRecognitionTimeline(
  surface: RecognitionSurface,
  prefs: { reducedMotion: boolean; thermal?: ThermalState },
): RecognitionTimeline {
  if (prefs.reducedMotion) return reducedTimeline(easeFor(surface));
  const plan = planFor(surface);
  if (prefs.thermal === undefined) return plan;
  return applyTempo(plan, recognitionTempo(prefs.thermal));
}

/**
 * Apply a `TempoMod` to a timeline plan. Pure.
 *
 * Multiplies *only* `liftMs` and `settleMs` (the approach); preserves
 * `holdMs` / `foldMs` byte-for-byte (the dwell is sacred — Mike POI-3,
 * Tanya §1 "Only `lift` and `settle` warm"). The ease overrides the
 * plan's ease only when `tempo.ease !== null`.
 *
 * Pure, ≤ 10 LoC.
 */
function applyTempo(plan: RecognitionTimeline, tempo: TempoMod): RecognitionTimeline {
  return {
    liftMs:   Math.round(plan.liftMs * tempo.approachScale),
    settleMs: Math.round(plan.settleMs * tempo.approachScale),
    holdMs:   plan.holdMs,
    foldMs:   plan.foldMs,
    ease:     tempo.ease ?? plan.ease,
  };
}

/** Named-plan dispatch — exhaustive over RecognitionSurface. Pure. */
function planFor(surface: RecognitionSurface): RecognitionTimeline {
  if (surface === 'letter')  return letterTimeline();
  if (surface === 'whisper') return whisperTimeline();
  if (surface === 'silent')  return silentTimeline();
  // Exhaustive: TypeScript narrows `surface` to `never` here.
  return assertNever(surface);
}

/** Surface-specific easing — kept stable under reduced motion. Pure. */
function easeFor(surface: RecognitionSurface): MotionEase {
  if (surface === 'letter')  return 'out';
  if (surface === 'whisper') return 'sustain';
  if (surface === 'silent')  return 'sustain';
  return assertNever(surface);
}

/** Compile-time exhaustiveness witness — fires only on union extension. */
function assertNever(x: never): never {
  throw new Error(`Unhandled RecognitionSurface: ${String(x)}`);
}

// ─── Time-domain query — pure, used by the hook and the temporal fence ────

/**
 * Phase at offset `tMs` from mount, given a timeline. Pure.
 *
 * Half-open intervals — the milestone time itself belongs to the LATER
 * phase, matching `setTimeout` semantics (the callback fires at or
 * after `delay`).
 */
export function phaseAt(t: RecognitionTimeline, tMs: number): RecognitionPhase {
  if (tMs < t.liftMs) return 'rest';
  if (tMs < t.liftMs + t.settleMs) return 'lift';
  if (tMs < t.liftMs + t.settleMs + t.holdMs) return 'settle';
  if (tMs < t.liftMs + t.settleMs + t.holdMs + t.foldMs) return 'hold';
  return 'fold';
}

/** Cumulative duration of the entire timeline (rest excluded). Pure. */
export function totalDurationMs(t: RecognitionTimeline): number {
  return t.liftMs + t.settleMs + t.holdMs + t.foldMs;
}

// ─── Invariants — locked by recognition-timeline.test.ts ───────────────────

/**
 * The four invariants the napkin pins:
 *
 *   • all durations ≥ 0
 *   • `holdMs ≤ MOTION.settle * 8` (no infinite dwell)
 *   • a *painting* timeline (totalDuration > 0) clears
 *     `settleMs + holdMs ≥ CEREMONY.breath` — the silence is perceptible.
 *     Vacuously true for the silent (no-op) plan.
 *
 * Pure, ≤ 10 LoC.
 */
export function timelineInvariantHolds(t: RecognitionTimeline): boolean {
  if (t.liftMs < 0 || t.settleMs < 0 || t.holdMs < 0 || t.foldMs < 0) return false;
  if (t.holdMs > MOTION.settle * 8) return false;
  if (totalDurationMs(t) === 0) return true;          // silent — vacuous
  return t.settleMs + t.holdMs >= CEREMONY.breath;
}

// ─── Test seam ─────────────────────────────────────────────────────────────

/**
 * Test seam — the named plan registry, exposed so the fence tests can
 * iterate without re-listing the surfaces. Mirrors the
 * `__testing__` idiom used across `lib/design/`.
 */
export const __testing__ = {
  reducedTimeline,
  planFor,
  easeFor,
  applyTempo,
} as const;
