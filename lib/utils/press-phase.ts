/**
 * press-phase — pure helpers for the `<Pressable>` tactile choreography.
 *
 * Modelled on `animation-phase.ts`. Owns the numeric invariants and the
 * phase → style resolvers. No React, no DOM, no state — just maps and
 * guarantees. Test it with plain assertions.
 *
 * Shared curve — NOT shared duration: a press is ~80ms, a thermal warmth
 * step is seconds. They ride the same `cubic-bezier(0,0,0.2,1)` easing
 * family ("sys-ease-out"). That's the entire claim. (Tanya §6 / Elon §8.)
 *
 * Credits: Mike K. (phase-machine template), Tanya D. (variant timing &
 * reduced-motion semantics), Elon M. (duration/easing distinction).
 */

import type { CSSProperties } from 'react';
import { MOTION, MOTION_REDUCED_MS } from '@/lib/design/motion';

// ─── Phase vocabulary ──────────────────────────────────────────────────────

/** Three-state tactile lifecycle. `idle` is the rest state. */
export type PressPhase = 'idle' | 'down' | 'settling';

/** Three variants — locked per Krystle/Tanya. No `destructive`, `link`, etc. */
export type PressVariant = 'solid' | 'ghost' | 'icon';

/** Two sizes. `md` is default. */
export type PressSize = 'sm' | 'md';

// ─── Timing constants — numeric invariants, sourced from MOTION ────────────

/**
 * Tactile press dwell: long enough to feel, short enough to stay snappy.
 * Not a named beat — 80ms sits *below* `instant` (150ms) by design (press
 * down is sub-perceptual; press release is instant). Kept as a local
 * constant because no other surface has this same receipt-of-touch dwell.
 */
export const PRESS_DOWN_MS = 80;

/** Release settle: halo re-blooms then fades. Tanya §6 250ms. */
export const PRESS_SETTLE_MS = 250;

/** Hover/enter duration — the shared depth/scale gesture beat. */
export const PRESS_ENTER_MS = MOTION.hover;

/** Safety margin so the settle timer always clears even under GC jitter. */
export const PRESS_SETTLE_BUDGET_MS = PRESS_SETTLE_MS + 16;

// ─── Invariants — a test can lock these down ───────────────────────────────

/** Must hold: down < settle < budget, and all positive. Pure. */
export function pressInvariantHolds(): boolean {
  if (PRESS_DOWN_MS <= 0) return false;
  if (PRESS_DOWN_MS >= PRESS_SETTLE_MS) return false;
  return PRESS_SETTLE_BUDGET_MS > PRESS_SETTLE_MS;
}

// ─── Transform resolvers — phase × variant × reduced → CSS transform ───────

/** Per-variant down-state scale. Icons tighten harder; text buttons nudge. */
export function resolvePressScale(variant: PressVariant): number {
  if (variant === 'icon') return 0.94;
  return 0.985;
}

/** Transform string for the `down` phase. Returns undefined if reduced. */
export function resolvePressTransform(
  phase: PressPhase,
  variant: PressVariant,
  reduced: boolean,
): string | undefined {
  if (reduced) return undefined;
  if (phase === 'down') return `scale(${resolvePressScale(variant)})`;
  return undefined;
}

// ─── Style resolver — pure map phase → inline CSSProperties ────────────────

/**
 * Inline style for the pressable surface. Transform and its transition
 * duration collapse to opacity under reduced motion (§6). Always returns
 * undefined in `idle` phase so the resting element owns its static styles.
 */
export function resolvePressStyle(
  phase: PressPhase,
  variant: PressVariant,
  reduced: boolean,
): CSSProperties | undefined {
  if (reduced) return resolveReducedPressStyle(phase);
  if (phase === 'idle') return undefined;
  return {
    transform: resolvePressTransform(phase, variant, reduced),
    transitionDuration: phase === 'down' ? `${PRESS_DOWN_MS}ms` : `${PRESS_SETTLE_MS}ms`,
    transitionTimingFunction: 'var(--sys-ease-out)',
  };
}

/** Reduced-motion branch: only opacity changes, 10ms — per Tanya §6. */
export function resolveReducedPressStyle(
  phase: PressPhase,
): CSSProperties | undefined {
  if (phase === 'idle') return undefined;
  return {
    opacity: phase === 'down' ? 0.85 : 1,
    transitionDuration: `${MOTION_REDUCED_MS}ms`,
    transitionProperty: 'opacity',
  };
}

// ─── Size resolvers — padding / min-height for the 2 sizes ─────────────────

/** Per-variant, per-size padding class. `icon` is a fixed-size square. */
export function resolveSizeClass(variant: PressVariant, size: PressSize): string {
  if (variant === 'icon') return 'p-sys-3 w-[40px] h-[40px]';
  if (size === 'sm') return 'px-sys-4 py-sys-2 min-h-[36px]';
  return 'px-sys-5 py-sys-3 min-h-[44px]';
}

// ─── Variant base classes — the shared skeleton ────────────────────────────

/** Every variant starts here: radius, transition, focus, typography. */
export const PRESSABLE_BASE =
  'relative inline-flex items-center justify-center gap-sys-2 ' +
  'thermal-radius font-sys-accent text-sys-caption ' +
  'transition-[background-color,border-color,color,transform,box-shadow,opacity] ' +
  'duration-[var(--sys-time-hover)] ease-out ' +
  'select-none touch-manipulation will-change-transform';

/** Variant-only surface tokens. Reads thermal tokens; no per-state overrides. */
export function resolveVariantClass(variant: PressVariant): string {
  if (variant === 'solid') return VARIANT_SOLID;
  if (variant === 'ghost') return VARIANT_GHOST;
  return VARIANT_ICON;
}

/* Solid hover halo: `whisper` (gold-tinted glow). The token-accent
   tint at warm+ states resolves to gold via ThermalProvider, so the
   accent-flavored hover is preserved without an arbitrary shadow string.
   Rest depth: `sys-rise` — the legacy `void` Tailwind alias is gone. */
const VARIANT_SOLID =
  'border text-foreground ' +
  '[background-color:color-mix(in_srgb,var(--token-accent)_14%,var(--token-surface))] ' +
  '[border-color:color-mix(in_srgb,var(--token-accent)_40%,transparent)] ' +
  'hover:[background-color:color-mix(in_srgb,var(--token-accent)_22%,var(--token-surface))] ' +
  'hover:-translate-y-micro ' +
  'hover:shadow-sys-whisper ' +
  'shadow-sys-rise';

const VARIANT_GHOST =
  'bg-transparent text-mist border ' +
  '[border-color:color-mix(in_srgb,var(--fog)_60%,transparent)] ' +
  'hover:[background-color:color-mix(in_srgb,var(--token-accent)_8%,transparent)] ' +
  'hover:[border-color:color-mix(in_srgb,var(--token-accent)_35%,transparent)] ' +
  'hover:text-foreground';

const VARIANT_ICON =
  'bg-transparent text-mist border-0 ' +
  'hover:[background-color:color-mix(in_srgb,var(--fog)_50%,transparent)] ' +
  'hover:text-foreground';

// ─── Disabled class — single shared rule across all variants ───────────────

/**
 * Disabled look. Tanya §5: pull 35% of current accent into mist — native to
 * the room's temperature, not a foreign "coldest stop."
 */
export const PRESSABLE_DISABLED =
  '[color:color-mix(in_srgb,var(--token-accent)_35%,var(--mist))] ' +
  '[border-color:color-mix(in_srgb,var(--fog)_50%,transparent)] ' +
  'bg-transparent shadow-none cursor-not-allowed ' +
  'hover:translate-y-0 hover:shadow-none';

// ─── Composer — the only function the component needs ─────────────────────

interface ComposeCtx {
  variant: PressVariant;
  size: PressSize;
  disabled: boolean;
  extra?: string;
}

/** Compose all className fragments in the correct order. Deterministic. */
export function composePressableClass(ctx: ComposeCtx): string {
  const parts = [
    PRESSABLE_BASE,
    resolveSizeClass(ctx.variant, ctx.size),
    resolveVariantClass(ctx.variant),
    ctx.disabled ? PRESSABLE_DISABLED : '',
    ctx.extra ?? '',
  ];
  return parts.filter(Boolean).join(' ');
}
