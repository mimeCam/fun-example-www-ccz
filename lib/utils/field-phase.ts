/**
 * field-phase — pure helpers for the `<Field>` listening surface.
 *
 * Mirrors `press-phase.ts`. Owns the numeric invariants and the
 * phase → style resolvers for the reader-writes-back primitive.
 * No React, no DOM. Tested with plain assertions.
 *
 * The claim is small and load-bearing (Tanya §TL;DR):
 *   • caret reads --token-accent
 *   • border crossfades 120ms on focus (no ring, no glow, no pulse)
 *   • disabled tint shares `press-phase.ts`'s PRESSABLE_DISABLED math —
 *     one bug-fix, two surfaces (Mike §4.2 / Tanya §3)
 *   • error is a held frame, no shake (Tanya §4 / Paul P1 #9)
 *   • reduced-motion collapses durations; colour still changes (Tanya §4)
 *
 * Credits: Mike K. (napkin §3.1 — promotion of timing constants), Tanya D.
 * (visual tokens §3, motion spec §4), Paul K. (held-beat error semantics),
 * Elon M. (kept scope tight — no sibling hush), Jason F. (caret = accent).
 */

import type { CSSProperties } from 'react';
import { PRESSABLE_DISABLED } from '@/lib/utils/press-phase';

// ─── Phase vocabulary ──────────────────────────────────────────────────────

/** Three-state listening lifecycle. `rest` is the idle state. */
export type FieldPhase = 'rest' | 'focus' | 'error-held';

/** Two variants — a textarea is a taller text input; that's it. */
export type FieldVariant = 'text' | 'multiline';

/** Two sizes — matches `<Pressable>`. `md` is default. */
export type FieldSize = 'sm' | 'md';

// ─── Timing constants — numeric invariants, not knobs ─────────────────────

/** Border crossfade on focus arrival/departure (Tanya §4). */
export const FIELD_BORDER_MS = 120;

/** Error held frame — long enough to register, short enough to forgive. */
export const FIELD_ERROR_HOLD_MS = 600;

/** Safety margin so the error-clear timer always fires even under GC jitter. */
export const FIELD_ERROR_BUDGET_MS = FIELD_ERROR_HOLD_MS + 16;

// ─── Invariants — a test can lock these down ──────────────────────────────

/** Must hold: border << hold, and both positive. Pure. */
export function fieldInvariantHolds(): boolean {
  if (FIELD_BORDER_MS <= 0) return false;
  if (FIELD_ERROR_HOLD_MS <= 0) return false;
  if (FIELD_BORDER_MS >= FIELD_ERROR_HOLD_MS) return false;
  return FIELD_ERROR_BUDGET_MS > FIELD_ERROR_HOLD_MS;
}

// ─── Border colour resolver — the ONLY thing that changes on phase swap ───

const BORDER_REST = 'var(--fog)';
const BORDER_FOCUS = 'color-mix(in srgb, var(--token-accent) 55%, var(--fog))';
const BORDER_ERROR = 'color-mix(in srgb, var(--rose) 40%, transparent)';

/**
 * Maps phase → border colour. Exactly one mapping, no branching on
 * variant/size — those don't affect the colour surface. Pure.
 */
export function resolveFieldBorderColor(phase: FieldPhase): string {
  if (phase === 'focus') return BORDER_FOCUS;
  if (phase === 'error-held') return BORDER_ERROR;
  return BORDER_REST;
}

// ─── Style resolver — inline CSS for the field surface ────────────────────

/**
 * Inline style for the field. `rest` returns undefined so the resting
 * element owns its static Tailwind classes (no override conflicts).
 * Reduced-motion drops the transition; colour still swaps (Tanya §4).
 */
export function resolveFieldStyle(
  phase: FieldPhase,
  reduced: boolean,
): CSSProperties | undefined {
  if (phase === 'rest') return undefined;
  return {
    borderColor: resolveFieldBorderColor(phase),
    transitionProperty: 'border-color, background-color',
    transitionDuration: reduced ? '10ms' : `${FIELD_BORDER_MS}ms`,
    transitionTimingFunction: 'var(--sys-ease-out)',
  };
}

// ─── Size resolver — padding + min-height for the 2 sizes ─────────────────

/** Text inputs keep a single-line min-height; multiline uses `rows` instead. */
export function resolveFieldSizeClass(
  variant: FieldVariant,
  size: FieldSize,
): string {
  if (variant === 'multiline') return 'px-sys-4 py-sys-3';
  if (size === 'sm') return 'px-sys-4 py-sys-2 min-h-[36px]';
  return 'px-sys-4 py-sys-3 min-h-[44px]';
}

// ─── Base class — the shared skeleton for every Field surface ─────────────

/** Radius, typography, transition slot, focus-ring.
 *
 *  Caret, placeholder, and selection are gesture-chrome — they live at
 *  the cascade root in lib/design/ambient-surfaces.css. Setting them
 *  per-field would drift from the thermal band (28% → 36% alpha on
 *  selection, mist-tinted placeholder, `var(--token-accent)` caret).
 *  Adoption guard blocks drift: `ambient-surfaces-adoption.test.ts`. */
export const FIELD_BASE =
  'block w-full rounded-sys-medium border bg-background ' +
  'text-foreground text-sys-caption ' +
  'transition-[border-color,background-color,color] ' +
  'duration-[var(--sys-time-instant)] ease-out ' +
  'focus:outline-none';

/** Multiline-only: disable resize (autogrow is out of scope per Tanya §6). */
export const FIELD_MULTILINE_EXTRA = 'resize-none';

/** Border colour for rest state — referenced once, always. */
export const FIELD_BORDER_REST_CLASS = '[border-color:var(--fog)]';

/** Hover tint on pointer devices (no touch) — Tanya §3. */
export const FIELD_HOVER =
  'hover:[border-color:color-mix(in_srgb,var(--token-accent)_25%,var(--fog))]';

/** Error surface — full-outline (not border-l) per Tanya §5c to avoid quote collision. */
export const FIELD_ERROR_CLASS =
  '[background-color:color-mix(in_srgb,var(--rose)_5%,transparent)] ' +
  '[border-color:color-mix(in_srgb,var(--rose)_40%,transparent)]';

// ─── Composer — the only function the component calls ────────────────────

interface ComposeCtx {
  variant: FieldVariant;
  size: FieldSize;
  disabled: boolean;
  invalid: boolean;
  extra?: string;
}

/** Compose all className fragments in deterministic order. */
export function composeFieldClass(ctx: ComposeCtx): string {
  const parts = [
    FIELD_BASE,
    resolveFieldSizeClass(ctx.variant, ctx.size),
    ctx.variant === 'multiline' ? FIELD_MULTILINE_EXTRA : '',
    ctx.invalid ? FIELD_ERROR_CLASS : `${FIELD_BORDER_REST_CLASS} ${FIELD_HOVER}`,
    ctx.disabled ? PRESSABLE_DISABLED : '',
    ctx.extra ?? '',
  ];
  return parts.filter(Boolean).join(' ');
}
