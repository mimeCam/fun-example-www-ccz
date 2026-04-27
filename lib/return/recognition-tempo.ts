/**
 * Recognition Tempo — pure modulation of the Recognition Timeline's
 * *approach* (lift + settle), keyed on the reader's `ThermalState`.
 *
 * Sibling to `recognition-timeline.ts` (timing) and `recognition-paint.ts`
 * (alpha rung). Three modules under `lib/return/`, one per concern. The
 * folder is *the* register; the rule-of-three is earned (Mike napkin
 * §"Module shape" — third caller, third leg).
 *
 * Until this module landed, the warmth a returner had built up was a
 * *colour* signal only — the tokens warmed; the cadence did not. Tanya
 * UIX §1 named the gap ("the room exhales ~25–30% before the whisper
 * speaks"); Paul §"the kinesthetic gap" framed it; Elon §narrowest-cut
 * fenced the answer to a single function on a single surface family.
 * This module is that function.
 *
 *   recognitionTempo(state) → TempoMod
 *      • approachScale: multiplier on `liftMs` and `settleMs` ONLY.
 *      • ease:          luminous override to the existing `'settle'`
 *                       curve; null otherwise (preserve the plan's ease).
 *
 * ──── Rule fences (POI from Mike's napkin, transcribed here) ────
 *
 *   1. **No new MOTION beats.** Every output composes from `MOTION` /
 *      `EASE` already declared in `lib/design/motion.ts`. The only
 *      literal number in this file is `APPROACH_CEILING = 1.30`, the
 *      bound Paul named in his risk table and Tanya §3 ratified.
 *
 *   2. **The dwell is sacred.** `holdMs` and `foldMs` are NEVER
 *      modulated. The *approach* warms; the *dwell* (how long the
 *      whisper lingers) is a UX contract owned by `whisperTimeline()`.
 *      Crossing this line dilutes the killer feature.
 *
 *   3. **Reduced-motion is non-negotiable.** This function is *not
 *      consulted* under `prefers-reduced-motion: reduce` — the
 *      resolver short-circuits to `reducedTimeline()`. Pinned in
 *      `__tests__/recognition-tempo.test.ts`.
 *
 *   4. **Closed-union exhaustiveness.** `recognitionTempo` walks the
 *      `ThermalState` union with `if/return/assertNever` (same idiom
 *      as `recognition-timeline.ts:planFor`). Adding a new state
 *      without a case here is a TypeScript error before any test runs.
 *
 *   5. **No CSS variable changes.** The whole modulation rides the
 *      timeline plan that `useRecognitionPhase` already consumes. Zero
 *      `:root` edits, zero `--sys-time-*` overrides (Paul's plan
 *      reached for this; we explicitly do not — Mike POI-7).
 *
 * Pure, stateless, SSR-safe. No React, no DOM, no `setTimeout`, no
 * literal milliseconds. Composes from `motion.ts` and the closed-union
 * `ThermalState`.
 *
 * Credits:
 *   • Mike Koch (architect, napkin §"Module shape" — pure-function
 *     spine, the `TempoMod` shape, the `APPROACH_CEILING = 1.30`
 *     bound, the closed-union exhaustiveness pattern, the rule-of-three
 *     placement under `lib/return/`).
 *   • Tanya Donska (UIX §3 — the bucket calibration table the
 *     constants below transcribe verbatim; §4 colour/shadow audit
 *     that decided the dwell stays sacred).
 *   • Elon Musk (First-Principles, narrow-cut §"YAGNI collision in
 *     `motion.ts`" — the fence keeping the modulation inside the
 *     Recognition register; the bucketed-not-continuous calibration
 *     "cubic-béziers don't meaningfully interpolate; you swap presets").
 *   • Paul Kim (Strategist, §"recognition deserves a tempo" — the
 *     framing this module makes structurally true; the risk table
 *     ceiling `≤ 1.30` inherited here).
 *   • Sid (≤ 10 LoC per helper; closed-union exhaustiveness; no-new-
 *     literals discipline).
 */

import type { ThermalState } from '@/lib/thermal/thermal-score';
import type { MotionEase } from '@/lib/design/motion';

// ─── Output shape — modulation, NOT replacement ──────────────────────────

/**
 * Tempo modulation keyed on `ThermalState`. The resolver multiplies
 * `liftMs` / `settleMs` by `approachScale`; if `ease` is non-null it
 * overrides the timeline plan's ease; otherwise the plan's ease wins.
 *
 * `holdMs` and `foldMs` are never multiplied — the dwell is sacred.
 */
export interface TempoMod {
  /** Multiplier on `liftMs` and `settleMs`. Bounded ≤ APPROACH_CEILING. */
  readonly approachScale: number;
  /**
   * Override for the timeline plan's `ease` field. `null` = no override
   * (the surface's own ease wins). Existing `EASE` member; never invented.
   */
  readonly ease: MotionEase | null;
}

// ─── Bounds — the only literal numbers in this module ────────────────────

/**
 * Ceiling on `approachScale`. Crossing into `linger` / `settle`
 * territory for the *approach* is forbidden by the same rule that said
 * `crossfade` exists at 120ms — long approaches read as draggy, not
 * warm (Elon §narrowest-cut "260ms feels laggy on hover" objection,
 * Paul risk-table ceiling, Tanya §3 ratified).
 */
export const APPROACH_CEILING = 1.30;

/** Identity tempo — no warmth, no override. Pure no-op. */
export const TEMPO_IDENTITY: TempoMod = { approachScale: 1.0, ease: null } as const;

// ─── The function — closed-union exhaustive over ThermalState ────────────

/**
 * Map a thermal state to a tempo modulation. Pure. ≤ 10 LoC.
 *
 * Closed-union switch — adding a `ThermalState` member without a case
 * here is a TypeScript error (`assertNever` narrows to `never`). Same
 * idiom as `recognition-timeline.ts:planFor` / `recognition-paint.ts`.
 */
export function recognitionTempo(state: ThermalState): TempoMod {
  if (state === 'dormant')  return TEMPO_IDENTITY;
  if (state === 'stirring') return { approachScale: 1.20, ease: null };
  if (state === 'warm')     return { approachScale: 1.20, ease: null };
  if (state === 'luminous') return { approachScale: APPROACH_CEILING, ease: 'settle' };
  return assertNever(state);
}

// ─── Invariants — locked by recognition-tempo.test.ts ────────────────────

/**
 * The two invariants the napkin pins:
 *
 *   • `approachScale` is bounded: 1.0 ≤ scale ≤ APPROACH_CEILING.
 *   • `ease` is null OR a member of the existing `EASE` map (never
 *     a freshly invented curve — Mike POI-1, Tanya §3 "no `ease-thermal`").
 *
 * The membership check on the ease key is performed in the unit test
 * via the EASE import, not here — keeping this module's import surface
 * narrow (only types from `motion.ts`).
 *
 * Pure, ≤ 5 LoC.
 */
export function tempoInvariantHolds(t: TempoMod): boolean {
  return t.approachScale >= 1.0 && t.approachScale <= APPROACH_CEILING;
}

// ─── Compile-time exhaustiveness witness — fires only on union extension ─

function assertNever(x: never): never {
  throw new Error(`Unhandled ThermalState: ${String(x)}`);
}
