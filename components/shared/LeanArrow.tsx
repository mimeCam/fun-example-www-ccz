/**
 * LeanArrow — the verb-primitive for forward-motion CTAs.
 *
 * One stateless kernel · N callers · zero props. The component is the
 * class wrapper for the CSS rule at `app/globals.css:1004–1011` (the 2px
 * `translateX` on `:focus-within`). Behaviour lives in CSS; this `.tsx`
 * exists to give the project ONE import surface and ONE place to pin
 * the contract so future callers cannot drift.
 *
 * Why a verb-primitive — Jason F. (#25/#49) framing, kept LOCAL on
 * purpose: the noun primitives in `components/shared/` (Pressable,
 * TextLink, Field, …) are *destinations* — they receive a reader's
 * gesture and stay still. The arrow is the *response* to that gesture
 * — a glyph that leans 2px when its host takes focus. Naming the
 * category here (not in `AGENTS.md`) is the deliberate compromise:
 * the prose earns its keep beside the code, the constitution stays
 * untaxed (Mike #80 §5, Tanya §6 — graduate to doctrine on the third
 * independent verb, not the first).
 *
 * Composition contract — what the kernel owns:
 *   1. The leading space lives INSIDE the span (`{' →'}`). Without it,
 *      the 2px translate moves the glyph alone and the verb+glyph
 *      pair drifts apart at large display sizes (Tanya §5.1 — the
 *      rigid-unit trick). Callers MUST NOT pre-pad with `&nbsp;` or
 *      append a trailing space.
 *   2. `aria-hidden="true"` is mandatory, not decorative. Without it,
 *      screen readers double-read the verb ("Save as card right
 *      arrow"). Callers cannot opt out.
 *   3. No props. Ever. Mike #78: *"one stateless kernel, N callers,
 *      no class hierarchy."* If a caller wants a different glyph,
 *      angle, or directional opt-out, that caller is a *different
 *      verb* — not a configuration of this one.
 *   4. The decision to render IS the caller's job — the kernel is
 *      unconditionally renderable. EmptySurface's link-vs-button
 *      branch (Tanya §3 semantic gate — reset is not forward motion)
 *      stays in EmptySurface; do NOT move that conditional in here.
 *
 * Reduced-motion: silenced by the universal override at
 * `globals.css:1224–1226`. The span is still rendered so visual rhythm
 * at rest is identical for motion-sensitive readers (Tanya §4).
 *
 * Forced-colors: the arrow inherits `currentColor` and survives high-
 * contrast OS palettes via `CanvasText`. No new override required.
 *
 * Adoption fence: `components/shared/__tests__/lean-arrow-fence.test.ts`
 * pins (A) no caller `<EmptySurface>` label trails a directional glyph,
 * (B) the kernel anchor lives in this file, (C) no other `.tsx` inlines
 * a `.plate-caption-arrow` span, (D) no `<TextLink>`/`<Pressable>`/
 * `<ActionPressable>` JSX-text child trails a raw `→ ↗ ⟶ › »`.
 *
 * Credits: Krystle C. (brief #61 — diagnosed the orphan at
 * `ResonancesClient.tsx:205` and scoped the kernel-promotion + fence-
 * widening shape), Mike K. (#48 napkin §5 — kernel architecture; #80
 * §5 — local JSDoc not project doctrine; #78 — one stateless kernel,
 * N callers), Tanya D. (UX §5.1 — leading-space-inside trick; §3
 * semantic gate; §4 reduced-motion still-renders), Jason F. (#25/#49
 * — verb-primitive framing, kept here as local prose), Elon M. (#22
 * — first-principles read on rule-of-one wearing rule-of-three's
 * coat; doctrine paragraph declined), Paul K. (#94 — felt-coherence
 * stake, four-bullet falsifiable DoD).
 */

export function LeanArrow(): JSX.Element {
  return <span aria-hidden="true" className="plate-caption-arrow">{' →'}</span>;
}
