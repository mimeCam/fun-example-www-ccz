/**
 * action-phase — pure helpers for the async-action settled-state pulse.
 *
 * Mirrors `press-phase.ts`: numeric invariants + pure resolvers. No React,
 * no DOM, no state — just maps and guarantees. Test it with assertions.
 *
 * The model bug it solves (Elon §): the press-phase ledger conflates
 * "finger lifted" (mechanical settling) with "work succeeded" (semantic
 * resolution). Two different timescales, two different witnesses. Keep the
 * mechanical layer naive (`press-phase.ts`); add a separate semantic layer
 * here. Compose, don't inherit.
 *
 * Composition only — zero new motion atoms:
 *   ACTION_FADE_MS = MOTION.crossfade  (120 ms — icon swap dissolve)
 *   ACTION_HOLD_MS = MOTION.linger     (1000 ms — checkmark dwell)
 *
 * Reduced-motion contract (Tanya §5.6): the *witness lands* — only the
 * *easing falls away*. Hold persists; crossfade collapses to MOTION_REDUCED_MS.
 *
 * Credits: Mike K. (napkin §5 — three-phase contract + safety budget),
 * Tanya D. (UX §5 — icon swap, verb tense, reduced-motion contract),
 * Krystle C. (original ~1200 ms target, primary-button exclusion),
 * Elon M. (mechanical-vs-semantic split), Sid (this lift).
 */

import type { CSSProperties } from 'react';
import { EASE, MOTION, MOTION_REDUCED_MS } from '@/lib/design/motion';

// ─── Phase vocabulary ──────────────────────────────────────────────────────

/** Three-phase semantic lifecycle. `idle` is the rest state. */
export type ActionPhase = 'idle' | 'busy' | 'settled';

// ─── Timing constants — sourced from MOTION (no new tokens) ────────────────

/**
 * Crossfade duration: 120 ms inline glyph dissolve. Sourced from
 * `MOTION.crossfade` — one home for the shortest grain in the motion ledger.
 */
export const ACTION_FADE_MS = MOTION.crossfade;

/**
 * Settled hold: 1000 ms checkmark dwell. Currently borrowed from
 * `MOTION.linger` — the same beat the passage-breathing surfaces use.
 *
 * Measure-then-change gate (Mike #94 §2.5, Tanya UX #76 §3.1):
 * Apple HIG targets 600–800 ms for confirmation dwell; on a calm
 * personal-blog page 1000 ms can read as *stuck* (Tanya's open audit).
 * **Do not change this constant in this PR.** A drop to 800 ms is the
 * correct conversation, but it requires (a) a stopwatch test on staging
 * and (b) decoupling from `MOTION.linger` so passage-breathing stays
 * untouched. Both are out-of-scope for the rung-lock cycle. The pin
 * below — `actionInvariantHolds()` + `action-phase.test.ts` — locks the
 * current numeric value so a casual edit fails CI before the reader
 * notices the regression.
 */
export const ACTION_HOLD_MS = MOTION.linger;

/** Safety net: hold + fade + one frame. Never lingers past this. */
export const ACTION_HOLD_BUDGET_MS = ACTION_HOLD_MS + ACTION_FADE_MS + 16;

// ─── Invariants — a test can lock these down ───────────────────────────────

/**
 * Must hold: fade < hold, budget covers both, all positive. Pure.
 *
 * Numeric pin (Mike #94 §2.5 — measure-then-change gate): the current
 * values are 120 ms fade and 1000 ms hold. A future PR that touches
 * either constant must update the matching assertion in
 * `lib/utils/__tests__/action-phase.test.ts` AND attach a stopwatch
 * receipt from a staging build — the dwell beat is felt by readers
 * without being named, so it cannot drift on vibes.
 */
export function actionInvariantHolds(): boolean {
  if (ACTION_FADE_MS <= 0) return false;
  if (ACTION_FADE_MS >= ACTION_HOLD_MS) return false;
  return ACTION_HOLD_BUDGET_MS > ACTION_HOLD_MS + ACTION_FADE_MS;
}

// ─── Duration resolvers — phase × reduced → ms ─────────────────────────────

/** Crossfade duration in ms. Reduced-motion collapses to the floor. */
export function resolveFadeMs(reduced: boolean): number {
  return reduced ? MOTION_REDUCED_MS : ACTION_FADE_MS;
}

// ─── Style resolver — pure map phase → inline CSSProperties ────────────────

/**
 * Inline transition style for the glyph/label swap layer. `idle` returns
 * `undefined` so the resting paint owns its look. `busy`/`settled` write
 * an opacity transition with the family's `sustain` ease curve.
 */
export function resolveSwapStyle(
  phase: ActionPhase,
  reduced: boolean,
): CSSProperties | undefined {
  if (phase === 'idle') return undefined;
  return {
    transitionProperty: 'opacity',
    transitionDuration: `${resolveFadeMs(reduced)}ms`,
    transitionTimingFunction: EASE.sustain,
  };
}

// ─── Verb tense — past-tense label per phase (Tanya §5.2) ──────────────────

/**
 * Map (phase, idle, settled) → label. `busy` collapses to `…`. The width
 * discipline (±1 ch) is the caller's concern — see SETTLED_LABELS table.
 */
export function resolvePhaseLabel(
  phase: ActionPhase,
  idleLabel: string,
  settledLabel: string,
): string {
  if (phase === 'busy') return '…';
  if (phase === 'settled') return settledLabel;
  return idleLabel;
}

/** Whether the settled glyph (CheckIcon) replaces the action glyph. */
export function showsCheck(phase: ActionPhase): boolean {
  return phase === 'settled';
}

// ─── Announcement contract — fingertip-local SR receipt (Mike #71 §4.1) ────

/**
 * Whether the SR-only `aria-live` span should hold a string this render.
 * Mount-on-`settled` / unmount-on-`idle|busy` is what guarantees the
 * once-per-settle firing edge — the live region appears with the witness
 * and is gone before another press can land. Pure, no React, no DOM.
 *
 * Same module that owns phase semantics owns this predicate so the JSX
 * stays presentational (Mike §4.1: keep the mount decision off the JSX
 * and inside the helper that already names the phases).
 */
export function announceOnSettle(phase: ActionPhase): boolean {
  return phase === 'settled';
}
