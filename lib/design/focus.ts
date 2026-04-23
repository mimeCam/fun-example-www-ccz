/**
 * Focus — reader-invariant primitive for the `:focus-visible` ring.
 *
 * NOT a 9th ledger. A cardinality-1 system is a *named constant*, not a
 * ledger row (Elon §1.4 / Mike napkin §"Why not Paul's plan"). This module
 * is the tiny TS **receipt** for three CSS-canonical numbers and one
 * convention token. The `AGENTS.md` table stays at 8 rows.
 *
 * Authoring layer: `app/globals.css` — the browser reads it.
 * Mirror layer:    `lib/design/focus.ts` — TS callers import `FOCUS.*`.
 * Sync guard:      `lib/design/__tests__/focus-sync.test.ts` — drift-fail.
 * Adoption guard:  `lib/utils/__tests__/field-adoption.test.ts:129` — the
 *                  existing "no per-component focus rings" scan is the
 *                  adoption guard for this surface. Do NOT fork it.
 *
 * The four non-negotiables of a reader-invariant surface (the contract
 * this module names for the whole site):
 *
 *   1. Does NOT warm with engagement.     — step-function presence, not tween.
 *   2. Does NOT personalize by archetype. — one posture for every reader.
 *   3. Does NOT fork with thermal state.  — dormant ≡ luminous, byte for byte.
 *   4. CLEARS WCAG SC 1.4.11 floor.       — α=0.8 × accent over surface ≥ 3:1
 *                                           at every thermal stop (enforced by
 *                                           `lib/utils/__tests__/contrast.test.ts`).
 *
 * The `// reader-invariant` tag is the **symmetric counterpart** to
 * `// <ledger-name>:exempt`. A ledger exemption declares "this value is
 * deliberately outside a warmth-reactive system." A reader-invariant tag
 * declares "this value is deliberately NOT reactive at all — do not add
 * tweens, warmth, archetype forks, or personalization." Grep either tag
 * to find every point where the declaration applies.
 *
 * Credits: Mike K. (napkin #38 — the receipt-not-ledger framing, the
 * sync-guard-as-symmetry call, the kill-list on a 9th ledger row),
 * Tanya D. (UIX #72 — "the ring is the room's guardrail," the 80% alpha
 * WCAG mitigation the sync guard now names, the §9 footnote-not-row vote
 * that shaped the documentation boundary), Elon M. (first-principles —
 * the cardinality-1-is-not-a-ledger rule this module is built around),
 * Paul K. (the business spine: "trust is built by surfaces that refuse
 * to personalize"), Krystle C. (the three magic numbers 2px/80%/2px that
 * this receipt names).
 */

// ─── Three numbers — mirror `:focus-visible` in globals.css:300–307 ────────

/**
 * Per-axis shape of the focus ring. Each field is a CSS-canonical number
 * mirrored from `app/globals.css`. The sync test fails if any drifts.
 *
 *   width  — outline thickness in CSS pixels.
 *   alpha  — accent lerp factor (0..1) inside the `color-mix()` call.
 *   offset — outline-offset in CSS pixels (gap between ring and element).
 *
 * No fourth axis. The ring's *color source* is the `FOCUS_INK` sibling
 * constant (shipped Mike #62) — that lands as a `// reader-invariant`
 * tagged one-liner routing through this module, not as a new axis on
 * `FOCUS`. Speculative consumers do not earn fields.
 *
 * Corner posture is NOT mirrored here. The ring passively inherits the
 * host's own `border-radius` via the two-stop `box-shadow` composition
 * in `app/globals.css` — pill hosts paint pill rings, card/input hosts
 * paint 8px rings, text links paint 6px rings. Shape belongs to the host.
 * (Deletion rationale: Mike K. napkin / Tanya D. UX #93 / Elon M. #35 —
 * the ring honours; it does not pledge.)
 */
export interface FocusRing {
  readonly width: number;
  readonly alpha: number;
  readonly offset: number;
}

/**
 * The three magic numbers, reader-invariant by contract. Units documented
 * inline — no conversion, no computation, no thermal lift. If a caller
 * wants a different posture, the caller is wrong: this is the guardrail.
 */
export const FOCUS: FocusRing = {
  width:  2,   // px — outline thickness
  alpha:  0.8, // 0..1 — accent lerp inside color-mix(); 80% clears WCAG 1.4.11
  offset: 2,   // px — outline-offset gap around the element
} as const;

/** CSS custom-property mirror root. Kept for future CSS-side consumers. */
export const FOCUS_CSS_PREFIX = '--sys-focus';

// ─── Corner posture belongs to the host (deleted sibling — see header) ────
//
// Previously exported: `FOCUS_RADIUS_CSS`, `FOCUS_RADIUS_RUNG`,
// `focusRadiusVar()`. Deleted — the ring no longer mirrors a radius
// because `:focus-visible` no longer declares one. The `box-shadow`
// composition inherits whatever `border-radius` the host already has.
// Ship-gate: `focus-sync.test.ts` asserts the *absence* of `border-radius`
// inside the `:focus-visible` rule body. Re-adding a radius here would
// resurrect the "rectangle on pill" bug (Tanya #93 §2, Mike napkin §2).

// ─── The reader-invariant ink — sibling to the three-axis ring ────────────

/**
 * `--sys-focus-ink` — the reader-invariant accent the `:focus-visible` ring
 * paints with. `// reader-invariant`: this colour does NOT warm with engagement,
 * does NOT personalize by archetype, does NOT fork with thermal state. It is
 * byte-identical at score 0 and score 100 (physics enforced by
 * `lib/design/__tests__/focus-ink-byte-identity.test.ts`).
 *
 * Equal to `THERMAL.accent = '#7b2cbf'` today by design review, NOT by import.
 * Keeping them textually independent means a future palette lift can move the
 * thermal anchor without silently dragging the ring with it — and vice versa.
 * See Mike #62 §"Points of interest" #2.
 *
 * No fourth axis on `FocusRing`: ink is a COLOUR, not a ring geometry dimension.
 * `FOCUS` stays `{ width, alpha, offset }` — the cardinality-3 guard in
 * `focus-sync.test.ts` is load-bearing. Sibling constants > field sprawl.
 */
export const FOCUS_INK = '#7b2cbf' as const;

/** CSS custom-property name of the ink token — the one authoring site. */
export const FOCUS_INK_CSS = '--sys-focus-ink' as const;

/** Ink as a CSS hex literal. Pure. */
export const focusInkCss = (): string => FOCUS_INK;

/** CSS `var()` reference — callers compose `color-mix(…, <ref> <pct>, …)`. */
export const focusInkVar = (): string => `var(${FOCUS_INK_CSS})`;

// ─── The convention token — the symmetric counterpart to `:exempt` ────────

/**
 * Grep-anchor for reader-invariant sites across the codebase. A comment
 * containing this exact string declares "this value does not warm, does
 * not personalize, does not archetype-fork — it is a reader-invariant
 * chrome surface." Examples of legitimate uses:
 *
 *   // reader-invariant — focus ring width sourced from FOCUS.width
 *   // reader-invariant — skip-link outline, same contract as focus ring
 *
 * The token is stable across refactors; tests and reviewers search for it.
 */
export const READER_INVARIANT = '// reader-invariant' as const;

// ─── Helpers — pure, each ≤ 10 LOC ────────────────────────────────────────

/** Ring width as a CSS length string (`"2px"`). Pure. */
export const widthPx = (): string => `${FOCUS.width}px`;

/** Outline-offset as a CSS length string (`"2px"`). Pure. */
export const offsetPx = (): string => `${FOCUS.offset}px`;

/** Alpha expressed as an integer percentage (`80`). Pure. */
export const alphaPct = (): number => Math.round(FOCUS.alpha * 100);

/** Alpha expressed as the `N%` string the CSS `color-mix()` wants. Pure. */
export const alphaPctString = (): string => `${alphaPct()}%`;

// ─── Invariants — a test can lock these down ──────────────────────────────

/**
 * Must hold: three axes are positive, alpha is a legal lerp (0..1) and
 * clears the documented WCAG floor (≥ 0.8), width/offset are small
 * integers (a "ring," not a slab). Corner posture is NOT checked here
 * — the ring no longer carries a radius; shape belongs to the host.
 * Pure. Tested in `focus-sync.test.ts`.
 */
export function focusInvariantHolds(): boolean {
  if (!axesArePositive()) return false;
  if (!alphaIsLegalLerp()) return false;
  return widthAndOffsetAreSmallIntegers();
}

/** Every axis is strictly positive — no zero-sized ring. */
function axesArePositive(): boolean {
  return FOCUS.width > 0 && FOCUS.alpha > 0 && FOCUS.offset > 0;
}

/** Alpha is a legal 0..1 lerp AND clears the 0.8 WCAG floor. */
function alphaIsLegalLerp(): boolean {
  return FOCUS.alpha <= 1 && FOCUS.alpha >= 0.8;
}

/** Width/offset are small integers — rings are tight by contract. */
function widthAndOffsetAreSmallIntegers(): boolean {
  const smallInt = (n: number): boolean =>
    Number.isInteger(n) && n >= 1 && n <= 4;
  return smallInt(FOCUS.width) && smallInt(FOCUS.offset);
}

// ─── Shipped follow-ups (history, for the next maintainer) ─────────────────
//
// 1. [SHIPPED — Mike #62] `--sys-focus-ink` — reader-invariant ink token.
//    See FOCUS_INK / FOCUS_INK_CSS above. The `:focus-visible` rule in
//    `app/globals.css` reads `var(--sys-focus-ink)`. Sync guard:
//    `focus-sync.test.ts`. Physics gate: `focus-ink-byte-identity.test.ts`.
//
// 2. [SHIPPED — Mike napkin / Tanya #93 / Elon #35] Corner posture: the
//    ring paints via a two-stop `box-shadow` and passively honours the
//    host's own `border-radius`. The `:focus-visible` rule declares NO
//    border-radius — pill hosts paint pill rings, cards paint 8px rings,
//    text links paint 6px rings. `FOCUS_RADIUS_CSS` / `FOCUS_RADIUS_RUNG`
//    / `focusRadiusVar()` were deleted with this ship; the absence-of-
//    radius assertion in `focus-sync.test.ts` is the new drift gate.
//
// 3. [SHIPPED — Mike #62] Contrast-sweep byte-identity: after the ink swap,
//    the ring colour is byte-identical at every thermal stop. The collapsed
//    sweep assertion lives in `contrast.test.ts`.
