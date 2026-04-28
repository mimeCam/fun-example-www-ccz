/**
 * Accent-Bias Ledger — surface-keyed hue-tilt carrier.
 *
 * The room learns to lean. The Recognition Beacon (`lib/return/recognition-
 * beacon.ts`) writes `data-archetype` on `<html>` < 5 ms before first paint.
 * `app/globals.css` maps each archetype to a small **applied** delta on the
 * hue wheel via `--thread-bias` (signed fractional degrees, clamped to ±3°
 * by spec — the geometry guard that makes ΔE2000 ∈ [0.8, 1.8] enforceable
 * at the warm spine fill stop). This module owns the **single carrier
 * expression** that consumes that variable on the only surface that leans
 * this slice: the Golden Thread fill.
 *
 * One module-scope constant (`THREAD_ACCENT_BIAS_FILTER`). One consumer
 * (`components/reading/GoldenThread.tsx`). One fence (`accent-bias-allow
 * list.fence.test.ts`) that forecloses copy-paste through the metaphor.
 *
 * Why a *surface-keyed* delta (`--thread-bias`) and NOT the wheel-anchor
 * (`--accent-bias`) directly:
 *
 *   The wheel-anchor `--accent-bias` is the *direction* each archetype's
 *   voice lives on the hue circle (deep-diver = 280° = cool violet,
 *   explorer = 38° = warm orange, …). Applying it as a `hue-rotate(...)`
 *   would spin the entire violet→gold thermal palette by that many degrees
 *   — for `deep-diver`, a 280° spin. Past JND. Past signature. Past every
 *   spec window in this slice.
 *
 *   `--thread-bias` is the *applied* lean — a signed delta toward the
 *   archetype's wheel-anchor, never larger than ±3°. The variable is
 *   named after the surface that consumes it, not the math that derives
 *   it (Tanya UIX §3 — "the variable name should match the felt thing").
 *   `--accent-bias` stays in `globals.css` as SSOT for *direction* — when
 *   a second surface joins the bow (Slice 3), it gets its own surface-
 *   keyed delta with its own clamp tolerance.
 *
 * Stranger ≡ today. The carrier expression carries a `, 0deg` fallback;
 * `:root` defaults `--thread-bias: 0deg`; `hue-rotate(0deg)` is a no-op.
 * Three-layer floor: byte-identical pixels for first-time visitors.
 *
 * Pure: zero side effects, zero allocations, zero React. The export is
 * one frozen string. The `__testing__` block is a TS mirror of the CSS
 * truth table (CSS is canonical) — keyed by `ArchetypeKey` so the
 * closed-union exhaustiveness check fires on the same PR that adds a
 * sixth archetype.
 *
 * Credits:
 *   • Mike Koch (architect, `_reports/from-michael-koch-project-architect-77.md`)
 *     — the napkin (§2 diagram), the file shape (§4), the LoC budget (§6),
 *     the rule-of-zero discipline (§7), the single-carrier-expression rule
 *     (§5 POI 1), the surface-naming rule (§8 risk: `THREAD_*` until rule-
 *     of-three fires).
 *   • Tanya Donska (UIX, `_reports/from-tanya-donska-expert-uix-designer-28.md`)
 *     — §3 layer audit (the *applied vs. anchor* reconciliation that
 *     produced `--thread-bias`), §3 sign convention (`+ warm / − cool`),
 *     §3 magnitude table (the five clamped deltas), §6 felt experience
 *     ("a deep-diver returns to a slightly cooler thread"), §11 open
 *     question #1 (engineering picks the variable name; Tanya's preferred
 *     name `--thread-bias` survives the review).
 *   • Krystle Clear (VP Product, prior #51) — graduate `--accent-bias`
 *     from dormant to LIVE, dual-rung gate, fence-pin contract.
 *   • Jason Fried (Creative, prior #60) — same diff, second rung of the
 *     recognition ladder (1-bit pre-warm → 2-bit lean).
 *   • Paul Kim (Strategist, prior #87) — the make-or-break: signature,
 *     not status; sub-conscious by construction; ±6° cap.
 *   • Elon Musk (First Principles, prior #65) — stranger-floor as the
 *     falsifiable invariant; ΔE2000 reality check on the 2-6° window.
 *   • Sid (50-yr coder) — `≤ 10 LoC` per helper, ledger-as-string-export
 *     pattern lifted from `THREAD_PRE_LIT_OPACITY` in GoldenThread.tsx.
 */

import type { ArchetypeKey } from '@/types/content';

// ─── Two-Lane Contract — Ambient (sealed) / Reciprocal (open by invitation) ──
//
// From this slice forward the accent-bias system has exactly two lanes.
// Both are felt; neither is announced. The comment is the architectural
// fence; the fence tests below are the enforcers.
//
//   ┌──────────────────────┬──────────────────┬──────────────────────────┐
//   │ Lane                 │ Trigger          │ Surfaces                 │
//   ├──────────────────────┼──────────────────┼──────────────────────────┤
//   │ AMBIENT (SEALED)     │ site state       │ GoldenThread spine fill  │
//   │                      │ (no user act)    │ (`--thread-alpha-pre`,   │
//   │                      │                  │  spine `filter: hue-     │
//   │                      │                  │  rotate(var(--thread-    │
//   │                      │                  │  bias, 0deg))`)          │
//   ├──────────────────────┼──────────────────┼──────────────────────────┤
//   │ RECIPROCAL (OPEN BY  │ USER GESTURE     │ `:focus-visible` ring    │
//   │  INVITATION)         │ (Tab / keyboard  │ (single CSS rule, paints │
//   │                      │  reach)          │  via `::after` pseudo so │
//   │                      │                  │  host content stays      │
//   │                      │                  │  reader-invariant)       │
//   └──────────────────────┴──────────────────┴──────────────────────────┘
//
// Why the seal matters (the rule the next ten "easy wins" must fail):
//   • The AMBIENT lane is sealed at one entry. Scrollbar-thumb tint,
//     `::placeholder` lean, `::selection` lean — all forbidden. A second
//     ambient surface earns its slot only via graduation to a perceptual
//     ledger directory (`lib/design/perceptual/`), which itself does not
//     exist until the rule-of-three fires. Today: rule-of-two on the
//     RECIPROCAL lane (Golden Thread spine + focus ring). Two consumers
//     ≠ a kernel. *Polymorphism is a killer.*
//   • The RECIPROCAL lane opens *by invitation only*. A second reciprocal
//     surface (e.g. `caret-color` on typing, link `:active` flash) needs
//     a fresh brief AND a separate review — not a copy-paste through the
//     fence. The fence prose teaches the contract on failure (Mike #38 §4,
//     the failure-message-is-documentation discipline).
//   • Anything without a real user gesture AND a real site response
//     belongs to NEITHER lane. The deferred slate is a feature: shorter,
//     not longer, by design (Tanya UIX #46 §10; Paul §"deferred-as-feature").
//
// Stranger floor — the three-layer zero — is preserved at every cell in
// every lane: `:root { --thread-bias: 0deg }` ⇒ `var(--thread-bias, 0deg)`
// fallback ⇒ `hue-rotate(0deg)` no-op ⇒ byte-identical pixels for
// first-time visitors. A stranger's `:focus-visible` and a stranger's
// Golden Thread fill MUST be byte-identical to today; if either drifts by
// one byte for a stranger, the lane contract failed and a sync fence fires.
//
// Enforcement (the contract made executable):
//   • `accent-bias-allowlist.fence.test.ts`     — AMBIENT lane allow-list
//                                                  (one JSX call site).
//   • `focus-reciprocal-lane.fence.test.ts`     — RECIPROCAL lane allow-
//                                                  list (one CSS rule).
//   • `accent-bias-calibration.fence.test.ts`   — ΔE2000 windows per stop.
//   • `focus-ring-contrast-audit.test.ts`       — WCAG 1.4.11 swept across
//                                                  all five archetype leans.
//
// What this file owns and what it does NOT:
//   This file owns the SINGLE carrier expression (`THREAD_ACCENT_BIAS_FILTER`)
//   and the geometry/perceptual budgets. It does NOT own a per-lane factory,
//   a `accentBiasFilter(surface)` helper, or a `--focus-bias` synonym. The
//   carrier expression is named after the surface that introduced it
//   (`THREAD_*`). When a third reciprocal surface earns its slot, that PR
//   mints the kernel name and graduates the math; until then, the surface
//   name is the architecture (Tanya UIX §3 — name the variable after the
//   felt thing; Mike #54 POI 2 — speculative abstraction is the bug).
//
// Credits (this lane-contract block):
//   • Jason Fried (Creative Director) — the Ambient/Reciprocal lens itself
//     (the durable architectural deposit; the rest of the rhetoric does
//     not survive code review per Elon's cut).
//   • Tanya Donska (UIX #46 §2 / §10) — the lane table, the deferred slate
//     as a feature, the "neither lane = does not ship" rule.
//   • Mike Koch (architect, napkin #54 §POI 2 / §"What I am explicitly
//     NOT doing") — the rule-of-zero discipline, the no-factory cut, the
//     surface-name-is-the-architecture rule preserved through the lift.
//   • Elon Musk (first principles) — "identical bits ⇒ pick one framing":
//     the lane comment is the only narrative artifact in source.
//   • Paul Kim (strategy) — the must-not-do list (no animation, no token
//     mint, no second reciprocal surface this sprint) baked into the fence.
//   • Sid (50-yr coder) — the source-string fence pattern both lanes
//     inherit from (`presence-pre-lit-allowlist`, `accent-bias-allowlist`).

// ─── Single carrier expression — the ONE call to hue-rotate in this codebase ──

/**
 * The fill-element `filter:` value that leans the Golden Thread spine
 * toward the returner's archetype. Reads `--thread-bias` (set by CSS
 * truth-table rules in `app/globals.css` keyed off `[data-archetype]`),
 * with a `, 0deg` fallback that holds the stranger floor when the
 * Recognition Beacon IIFE never runs (CSP, JS disabled, future minifier
 * bug).
 *
 * Stranger floor — three layers of zero:
 *   1. `:root { --thread-bias: 0deg }` — CSS default, no archetype.
 *   2. `var(--thread-bias, 0deg)` — fallback if the var is unset.
 *   3. `hue-rotate(0deg)` is a no-op (compositor-thread, byte-equivalent).
 *
 * Returner with archetype — clamped lean:
 *   The CSS truth table sets `--thread-bias` to a signed value in
 *   `[-6deg, +6deg]` per archetype (positive = warmer, negative = cooler).
 *   See `app/globals.css :root { --thread-bias }` block.
 *
 * Pinned by `accent-bias-allowlist.fence.test.ts` (single authoring site)
 * and `golden-thread-accent-bias.fence.test.ts` (wire-up + range cap +
 * stranger floor).
 *
 * Naming: `THREAD_*` because this is the THREAD's accent-bias filter.
 * When surface #2 joins the bow (Slice 3), rule-of-three lifts to
 * `accentBiasFilter(surface)` or splits per-surface gain. Until then,
 * name the surface — speculative abstraction is the bug (Mike #5 POI 1).
 */
export const THREAD_ACCENT_BIAS_FILTER = 'hue-rotate(var(--thread-bias, 0deg))';

// ─── Range cap — the geometry guard for the perceptual whisper window ───────

/**
 * The maximum absolute lean (in degrees) any single `--thread-bias` value
 * may take. Pinned by `golden-thread-accent-bias.fence.test.ts §4` against
 * the actual values in `globals.css`.
 *
 * ±3° is the *geometry guard* that makes the perceptual whisper window
 * mechanically enforceable at BOTH spine fill stops:
 *   • warm `BRAND.gold = #f0c674`, ΔE/° ≈ 0.66 → cap pegs ceiling at ~1.98
 *   • cool `BRAND.primary = #7b2cbf`, ΔE/° ≈ 0.51 → cap pegs ceiling at ~1.53
 * Both inside `[…, 1.8]`. One number, one source of truth, in degrees,
 * mechanically pinned (Tanya UIX #92 §5; Mike #92 §2 / #56 §POI 6).
 *
 * If a future archetype calibration wants a wider window, change THIS
 * number first — the fence will then surface every CSS rule that drifts
 * outside the new bound. *Do not* introduce a per-stop cap; one geometry
 * guard covers both ends with margin.
 */
export const THREAD_BIAS_MAX_ABS_DEG = 3;

// ─── Recognition Whisper Budgets — per-baseline ΔE2000 windows ──────────────

/**
 * The perceptual whisper window at the **warm** spine fill stop
 * (`BRAND.gold = #f0c674`). A returner's lean must measure inside
 * `[0.8, 1.8]` ΔE2000 against the stranger baseline. Above 1.8 the lean
 * becomes status (the room shouts); below 0.8 the lean is byte-noise (the
 * room never leaned). Tuple positions: `[FLOOR, CEILING]`.
 *
 * Imported by `accent-bias-calibration.fence.test.ts §1`. SSOT lives here
 * — the carrier module owns the budget; the fence consumes it (Mike #56
 * §POI 1 — "begin from shared code", AGENTS.md §16).
 */
export const RECOGNITION_WHISPER_BUDGET_WARM: readonly [number, number] = [0.8, 1.8];

/**
 * The perceptual whisper window at the **cool** spine fill stop
 * (`BRAND.primary = #7b2cbf`). Same ceiling (1.8 — the lean still becomes
 * status above it), lower floor (0.7 — see honesty paragraph below).
 *
 * Honesty about the metric noise floor (Elon §1.5, Sharma/Wu/Dalal 2005):
 *   The cool stop measures ΔE/° ≈ 0.51 (vs. 0.66 at the warm stop), so
 *   the smallest archetype magnitudes (±1.5°) sit at ~0.76 ΔE2000 —
 *   0.04 ΔE under the warm floor of 0.8. That 0.04 gap is *below ΔE2000's
 *   own inter-observer noise floor* (~0.5–1.0 ΔE per Sharma/Wu/Dalal), so
 *   "0.76 vs 0.80" is a distinction the metric itself cannot reliably
 *   make. We honor the math by lowering the cool floor to 0.7 — the felt
 *   experience is identical at the warm peak (Tanya UIX #78 §3a "felt-
 *   equivalent, not numerically equivalent"), and the contract becomes
 *   honestly enforceable at the cool stop instead of aspirational.
 *
 * Why two literals and not `whisperBudgetAt(stop)` (Mike #56 TL;DR / Elon
 * §6 / Tanya #78 §6): N=2 baselines is one short of the rule-of-three
 * trigger this repo enforces (`accent-bias.ts:96-99`,
 * `measure-thread-bias-deltaE.ts:22-27`). When calibration #2 fires
 * (Slice 3's second surface, or motion-JND on crossfades), *that PR*
 * mints `whisperBudgetAt(...)` and earns the move into a perceptual
 * ledger directory. Until then: name the surface, don't generalize the
 * math. The asymmetry (0.8 warm vs. 0.7 cool) is the math; honor it.
 */
export const RECOGNITION_WHISPER_BUDGET_COOL: readonly [number, number] = [0.7, 1.8];

/**
 * Cool-stop ΔE2000 ceiling for the OFF-panel cells (cool × {D55, D75}).
 * Single number, not a tuple — the shape carries the honesty: an
 * asymmetric, ceiling-only window for the two cells the metric cannot
 * resolve a floor on.
 *
 * Why no floor here. Under D55 the resonator (-1.5°) lands at ~0.698
 * (0.002 below the on-panel 0.7 cool floor). Under D75 the ±1.5° pair
 * falls to ~0.55. Both are below ΔE2000's own ~0.5–1.0 inter-observer
 * noise floor (Sharma/Wu/Dalal 2005), so a floor promise on these cells
 * is aspirational, not falsifiable. We promise the ceiling — the loud-
 * floor at which a lean would become status — and concede the floor
 * mechanically. The on-panel cool tuple `[0.7, 1.8]` keeps its floor;
 * this constant is *additive*, not a replacement.
 *
 * Stranger floor (0° lean ⇒ ΔE = 0) holds at every cell by construction
 * (three-layer zero in the carrier expression). Cool-side closure is
 * pinned across tri-illuminant; the floor is honestly conceded sub-JND
 * on cool × {D55, D75}.
 *
 * Imported by `accent-bias-calibration.fence.test.ts §1d / §1f`. No
 * sibling constant for "warm × off-panel" — the warm baseline keeps a
 * full `[floor, ceiling]` window across all three illuminants because
 * its ΔE/° (≈0.66) lifts every magnitude above the noise floor at every
 * white point. *Polymorphism is a killer* (Mike #9 §7 POI 9): one shape
 * per stop, no preemptive `whisperCeilingAt(stop)` lift until rule-of-
 * three fires. The asymmetric `[floor, ceiling] ∪ { ceiling }` pair is
 * the smallest honest change.
 */
export const RECOGNITION_WHISPER_CEILING_COOL_OFF_PANEL: number = 1.8;

// ─── Test-only mirrors of the CSS truth table — SSOT for the fences ──────────

// Trinity loudness ladder (un-formalised, unit-mixed):
//   thread.ΔE  <  warmth.tempShift  <  voice.toneSwap
// This file owns the quietest rung — the whisper. Felt, never seen.
// (Tanya UIX #92 §7; Jason / Paul framing #92.)

/**
 * The five archetypes' applied `--thread-bias` values, in fractional
 * degrees. MIRRORS the truth table in `app/globals.css` (same five rules,
 * same five magnitudes). Drift between these and the CSS rules is caught
 * by `golden-thread-accent-bias.fence.test.ts §3` via a literal-string
 * cross-check.
 *
 * Sign convention (Tanya §3):
 *   + warmer (toward gold/amber/rose)
 *   − cooler (toward cyan/violet)
 *
 * Magnitude calibration (Tanya UIX #92 §4 / Mike #92 §2 — at the warm
 * spine fill stop `BRAND.gold = #f0c674`, ΔE/° ≈ 0.66):
 *   deep-diver  → -2.5°  (cool — deepest pull toward violet,  ΔE ≈ 1.65)
 *   explorer    → +2.5°  (warm — strongest lean to amber,     ΔE ≈ 1.65)
 *   collector   → -2.0°  (cool — mid-cool toward cyan,        ΔE ≈ 1.32)
 *   faithful    → +1.5°  (settled warm,                       ΔE ≈ 0.99)
 *   resonator   → -1.5°  (kindred cool,                       ΔE ≈ 0.99)
 *
 * Sub-JND ⇒ direction carries identity, magnitude carries depth. Two
 * archetypes share a magnitude (1.5° here, twice — one warm, one cool);
 * that is correct and intentional (Tanya §12 — the design is the sign).
 *
 * Marked `__testing__` so a maintainer reading the file sees the values
 * are mirrors, not SSOT — the CSS file is canonical. Keyed by
 * `ArchetypeKey` so a sixth archetype flips this file red on the same
 * PR (closed-union exhaustiveness witness).
 */
const THREAD_BIAS_BY_ARCHETYPE: Readonly<Record<ArchetypeKey, number>> = {
  'deep-diver': -2.5,
  'explorer':   +2.5,
  'faithful':   +1.5,
  'resonator':  -1.5,
  'collector':  -2.0,
};

export const __testing__ = { THREAD_BIAS_BY_ARCHETYPE } as const;
