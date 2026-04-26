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

/** Crossfade duration: 120 ms inline glyph dissolve. */
export const ACTION_FADE_MS = MOTION.crossfade;

/** Settled hold: 1000 ms checkmark dwell. */
export const ACTION_HOLD_MS = MOTION.linger;

/** Safety net: hold + fade + one frame. Never lingers past this. */
export const ACTION_HOLD_BUDGET_MS = ACTION_HOLD_MS + ACTION_FADE_MS + 16;

// ─── Invariants — a test can lock these down ───────────────────────────────

/** Must hold: fade < hold, budget covers both, all positive. Pure. */
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
