/**
 * link-phase — pure helpers for the `<TextLink>` reading surface.
 *
 * Modelled on `press-phase.ts` / `field-phase.ts`. Owns the numeric
 * invariants, the route → destination-accent map, and the phase → style
 * resolvers. No React, no DOM, no state — just maps and guarantees.
 * Test it with plain assertions.
 *
 * Geometry, not metaphor (Tanya §2, Elon §2): a link wears the room it
 * lives in. One variant — `passage` — lets the hover crossfade to the
 * destination room's accent, so the reader feels the next room before
 * the click. Underline = load-bearing affordance (§3.4). Offset bloom =
 * the 1-px spatial gesture (§4). Reduced motion collapses duration;
 * colour still lands (§5.1).
 *
 * Credits: Mike K. (napkin §3 — the fourth-primitive shape + route →
 * accent derivation), Tanya D. (variant table, motion spec, contrast
 * gate), Paul K. (contrast-at-both-endpoints non-negotiable), Elon M.
 * (no frontmatter tax, no membrane prose, external-link hygiene),
 * Krystle C. (phase-module + hook + adoption-guard pattern).
 */

import type { CSSProperties } from 'react';
import { MOTION, MOTION_REDUCED_MS } from '@/lib/design/motion';

// ─── Phase vocabulary ──────────────────────────────────────────────────────

/** Three-state reading lifecycle. `idle` is the rest state. */
export type LinkPhase = 'idle' | 'hover' | 'focus';

/** Three variants — locked. `inline` body prose, `passage` cross-room, `quiet` footnote. */
export type LinkVariant = 'inline' | 'passage' | 'quiet';

// ─── Timing & geometry constants — numeric invariants, sourced from MOTION

/**
 * Hover crossfade — shared inline-dissolve beat (`crossfade`, 120ms). This
 * is the same beat as `<Field>` border crossfade, by design: a link and a
 * field focus must read as the *same gesture* across the room (Tanya §3).
 */
export const LINK_HOVER_MS = MOTION.crossfade;

/** Reduced-motion dwell — color still lands, motion does not perform. */
export const LINK_REDUCED_MS = MOTION_REDUCED_MS;

/** Underline thickness in px. `inline`/`passage` rest → hover. */
export const LINK_UNDERLINE_REST_PX = 1;
export const LINK_UNDERLINE_HOVER_PX = 2;

/** Underline offset in px — `inline`/`passage` bloom (Tanya §4). */
export const LINK_OFFSET_REST_PX = 3;
export const LINK_OFFSET_HOVER_PX = 4;

/** Quiet-variant rest opacity (§3.1, mist/60 floor). */
export const LINK_QUIET_REST_OPACITY = 0.6;

// ─── Invariants — a test can lock these down ──────────────────────────────

/** Must hold: thickness/offset grow on hover; reduced << hover. Pure. */
export function linkInvariantHolds(): boolean {
  if (LINK_HOVER_MS <= 0) return false;
  if (LINK_UNDERLINE_REST_PX >= LINK_UNDERLINE_HOVER_PX) return false;
  if (LINK_OFFSET_REST_PX >= LINK_OFFSET_HOVER_PX) return false;
  return LINK_REDUCED_MS < LINK_HOVER_MS;
}

// ─── Route → room accent map ──────────────────────────────────────────────

/** Destination room identifier. `current` means "wear the caller's accent". */
export type RoomAccent = 'current' | 'gold' | 'rose';

/** External href detection — any protocol or protocol-relative URL. */
export function isExternalHref(href: string): boolean {
  if (!href) return false;
  if (/^(https?:|mailto:|tel:)/i.test(href)) return true;
  return href.startsWith('//');
}

/** Strip query + hash so the pathname alone drives the room lookup. */
function stripHashQuery(href: string): string {
  const noHash = href.split('#')[0];
  return noHash.split('?')[0];
}

/**
 * Destination room for a given href — no IO, pure lookup.
 * `/mirror` → gold, `/resonances` → rose, everything else → current room.
 */
export function resolveRoomForPath(href: string): RoomAccent {
  const p = stripHashQuery(href);
  if (p === '/mirror' || p.startsWith('/mirror/')) return 'gold';
  if (p === '/resonances' || p.startsWith('/resonances/')) return 'rose';
  return 'current';
}

/** CSS `var(…)` fragment for a room accent. */
export function accentVarForRoom(room: RoomAccent): string {
  if (room === 'gold') return 'var(--gold)';
  if (room === 'rose') return 'var(--rose)';
  return 'var(--token-accent)';
}

/**
 * Destination accent for a href. External links never cross rooms —
 * they stay on the caller's accent (no "next room" story off-site).
 */
export function resolveDestinationAccent(href: string): string {
  if (isExternalHref(href)) return 'var(--token-accent)';
  return accentVarForRoom(resolveRoomForPath(href));
}

// ─── Per-property resolvers — each pure, ≤ 10 LOC ─────────────────────────

/** Text colour. `quiet` stays mist; `passage` on hover → destination accent. */
export function resolveLinkColor(
  phase: LinkPhase, variant: LinkVariant, destAccent: string,
): string {
  if (variant === 'quiet') return 'var(--mist)';
  if (variant === 'passage' && phase !== 'idle') return destAccent;
  return 'var(--token-accent)';
}

/**
 * Opacity. `inline`/`passage` rest rides `--token-accent-opacity` so the
 * link intensifies with the room; hover lifts to 1. `quiet` holds 60 % at
 * rest, full on hover (§3.1).
 */
export function resolveLinkOpacity(
  phase: LinkPhase, variant: LinkVariant,
): string | number {
  if (variant === 'quiet') return phase === 'idle' ? LINK_QUIET_REST_OPACITY : 1;
  if (phase === 'idle') return 'var(--token-accent-opacity, 1)';
  return 1;
}

/** Underline thickness. `quiet` rest has no underline; others ship 1 → 2 px. */
export function resolveLinkThickness(
  phase: LinkPhase, variant: LinkVariant,
): number {
  if (variant === 'quiet') return phase === 'idle' ? 0 : LINK_UNDERLINE_REST_PX;
  return phase === 'idle' ? LINK_UNDERLINE_REST_PX : LINK_UNDERLINE_HOVER_PX;
}

/** Underline offset. `quiet` stays at rest offset; others bloom 3 → 4 px. */
export function resolveLinkOffset(
  phase: LinkPhase, variant: LinkVariant,
): number {
  if (variant === 'quiet') return LINK_OFFSET_REST_PX;
  return phase === 'idle' ? LINK_OFFSET_REST_PX : LINK_OFFSET_HOVER_PX;
}

// ─── Style composer — phase × variant × reduced → CSSProperties ───────────

/** Colour + opacity sub-map. Pure, 4 LOC. */
function resolveLinkPaint(
  phase: LinkPhase, variant: LinkVariant, destAccent: string,
): CSSProperties {
  return {
    color: resolveLinkColor(phase, variant, destAccent),
    opacity: resolveLinkOpacity(phase, variant) as number,
  };
}

/** Underline sub-map. Zero thickness collapses to `text-decoration: none`. */
function resolveLinkUnderline(
  phase: LinkPhase, variant: LinkVariant,
): CSSProperties {
  const thick = resolveLinkThickness(phase, variant);
  return {
    textDecorationLine: thick === 0 ? 'none' : 'underline',
    textDecorationColor: 'currentColor',
    textDecorationThickness: `${Math.max(thick, 1)}px`,
    textDecorationSkipInk: 'auto',
    textUnderlineOffset: `${resolveLinkOffset(phase, variant)}px`,
  };
}

/** Transition sub-map. One duration, one easing, four properties at once. */
function resolveLinkTransition(reduced: boolean): CSSProperties {
  return {
    transitionProperty:
      'color, text-decoration-thickness, text-underline-offset, text-decoration-color, opacity',
    transitionDuration: reduced ? `${LINK_REDUCED_MS}ms` : `${LINK_HOVER_MS}ms`,
    transitionTimingFunction: 'var(--sys-ease-out)',
  };
}

/**
 * Inline style for the anchor surface. Always returns a populated object
 * (unlike Pressable's idle-undefined branch) because we carry thermal
 * opacity even at rest — the room's voice is the link's voice.
 */
export function resolveLinkStyle(
  phase: LinkPhase,
  variant: LinkVariant,
  reduced: boolean,
  destAccent: string,
): CSSProperties {
  return {
    ...resolveLinkPaint(phase, variant, destAccent),
    ...resolveLinkUnderline(phase, variant),
    ...resolveLinkTransition(reduced),
  };
}

// ─── Class composer — the small Tailwind slot ─────────────────────────────

/** The shared skeleton: inline flow, touch-safe, focus-ring inherits global. */
export const LINK_BASE =
  'inline cursor-pointer select-none ' +
  'focus:outline-none ' +
  'active:[text-decoration-thickness:2px]';

/** External links get a tiny nowrap so the glyph never breaks off its word. */
export const LINK_EXTERNAL_EXTRA = 'whitespace-nowrap';

interface LinkComposeCtx {
  variant: LinkVariant;
  isExternal: boolean;
  extra?: string;
}

/** Compose all className fragments in deterministic order. */
export function composeLinkClass(ctx: LinkComposeCtx): string {
  const parts = [
    LINK_BASE,
    ctx.isExternal ? LINK_EXTERNAL_EXTRA : '',
    ctx.extra ?? '',
  ];
  return parts.filter(Boolean).join(' ');
}
