/**
 * CollapsibleSlot — helpers for the layout envelope that owns a portal's
 * breathing room across both the "child paints" and "child returns null"
 * branches. Pure: no React, no hooks, no DOM.
 *
 * The bug class this prevents (Mike #2 §1):
 *
 *   Every sibling of a conditionally-rendered portal is silently doing
 *   margin arithmetic for the case the portal collapses. That is implicit
 *   polymorphism leaking across a component boundary. Move the margin
 *   onto the portal's outer envelope, where it lives whether the inner
 *   paints or not. Single owner, single rule.
 *
 * The helper here returns the className string the envelope `<div>` wears.
 * The envelope SSRs identically whether children render content or `null`
 * — that is the geometric contract the wrapper exists to enforce.
 *
 * Vocabulary in docs, integers in code (spacing ledger §1). Callers pass
 * 1-based `SysSpaceIndex` values; helpers emit `mt-sys-N` / `mb-sys-N`
 * Tailwind utilities that resolve to the canonical `--sys-space-*` ledger.
 *
 * Credits: Mike K. (#2 napkin §3–§5 — the envelope shape, the polymorphism
 * kill, the `slotEnvelopeClasses` contract), Tanya D. (#3 §3 — the
 * "stranger and returner produce the same DOM rhythm" framing that makes
 * the contract physical, not stylistic), Krystle C. (the SSR pin —
 * envelope class string is identical server-side and client-side, no
 * hydration shift), AGENTS.md (`Begin from shared` — `spaceClassOf` from
 * `lib/design/spacing.ts` is the single source we reach for, no new tokens).
 */

import { spaceClassOf, type SysSpaceIndex } from './spacing';

// ─── Public API — sealed shape, no escape hatches ─────────────────────────

/**
 * Margins the envelope carries. Either or both may be omitted; an omitted
 * side emits no class (no `m-0` literal, no zero-rung override). The
 * envelope still mounts — its presence is the contract, not its margins.
 */
export interface CollapsibleSlotMargins {
  /** `mt-sys-N` rung for the envelope's top margin. */
  readonly top?: SysSpaceIndex;
  /** `mb-sys-N` rung for the envelope's bottom margin. */
  readonly bottom?: SysSpaceIndex;
}

// ─── Helpers — pure, each ≤10 LOC ─────────────────────────────────────────

/** Top-margin Tailwind class for a rung, or empty string if absent. Pure. */
export const topMarginClass = (n: SysSpaceIndex | undefined): string =>
  n === undefined ? '' : spaceClassOf('mt', n);

/** Bottom-margin Tailwind class for a rung, or empty string if absent. Pure. */
export const bottomMarginClass = (n: SysSpaceIndex | undefined): string =>
  n === undefined ? '' : spaceClassOf('mb', n);

/**
 * Envelope className — joins top + bottom rung classes, dropping empties.
 * Returns a stable string suitable for direct attachment to a `<div>`.
 * SSR / CSR identical by construction (no hooks, no random ordering).
 * Pure.
 */
export function slotEnvelopeClasses(margins: CollapsibleSlotMargins): string {
  const parts = [topMarginClass(margins.top), bottomMarginClass(margins.bottom)];
  return parts.filter(Boolean).join(' ');
}

// ─── Invariants — a test can lock these down ──────────────────────────────

/**
 * The envelope must be *non-empty* in at least one direction; otherwise
 * the wrapper carries no breath, has no reason to mount, and the whole
 * abstraction degrades into noise. Reviewer-level guard, not runtime.
 * Pure.
 */
export const hasAnyMargin = (margins: CollapsibleSlotMargins): boolean =>
  margins.top !== undefined || margins.bottom !== undefined;

/**
 * The single legal use case for the envelope, named so the JSDoc on the
 * component can point at one sentence rather than reinvent the rule.
 * Reads like: a child that may render `null` and whose absent margin
 * would collapse a sibling's expected gap.
 */
export const COLLAPSIBLE_SLOT_LEGAL_USE =
  'A child that may render null and whose absent margin would collapse a sibling expected gap.';
