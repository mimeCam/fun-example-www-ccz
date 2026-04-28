/**
 * Accent-Bias Ledger — surface-keyed hue-tilt carrier.
 *
 * The room learns to lean. The Recognition Beacon (`lib/return/recognition-
 * beacon.ts`) writes `data-archetype` on `<html>` < 5 ms before first paint.
 * `app/globals.css` maps each archetype to a small **applied** delta on the
 * hue wheel via `--thread-bias` (signed degrees, clamped to ±6° by spec).
 * This module owns the **single carrier expression** that consumes that
 * variable on the only surface that leans this slice: the Golden Thread fill.
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
 *   archetype's wheel-anchor, never larger than ±6°. The variable is
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

// ─── Range cap — the perceived-tilt window ───────────────────────────────────

/**
 * The maximum absolute lean (in degrees) any single `--thread-bias` value
 * may take. Pinned by `golden-thread-accent-bias.fence.test.ts §4` against
 * the actual values in `globals.css`. ±6° is the "signature, not status"
 * window (Paul §"sub-conscious"; Elon §2.1 — below JND for most viewing
 * conditions at low chroma).
 *
 * If a future archetype calibration wants a wider window, change THIS
 * number first — the fence will then surface every CSS rule that drifts
 * outside the new bound.
 */
export const THREAD_BIAS_MAX_ABS_DEG = 6;

// ─── Test-only mirrors of the CSS truth table — SSOT for the fences ──────────

/**
 * The five archetypes' applied `--thread-bias` values, in degrees.
 * MIRRORS the truth table in `app/globals.css` (same five rules, same
 * five magnitudes). Drift between these and the CSS rules is caught by
 * `golden-thread-accent-bias.fence.test.ts §3` via a literal-string
 * cross-check.
 *
 * Sign convention (Tanya §3):
 *   + warmer (toward gold/amber/rose)
 *   − cooler (toward cyan/violet)
 *
 * Magnitude calibration (Tanya §3, ±6° window):
 *   deep-diver  → -6°  (cool — toward violet, depth)
 *   explorer    → +6°  (warm — toward orange, outward)
 *   faithful    → +3°  (settled — small warm)
 *   resonator   → -3°  (kindred — small cool)
 *   collector   → -5°  (ordered — toward cyan)
 *
 * Marked `__testing__` so a maintainer reading the file sees the values
 * are mirrors, not SSOT — the CSS file is canonical. Keyed by
 * `ArchetypeKey` so a sixth archetype flips this file red on the same
 * PR (closed-union exhaustiveness witness).
 */
const THREAD_BIAS_BY_ARCHETYPE: Readonly<Record<ArchetypeKey, number>> = {
  'deep-diver': -6,
  'explorer':   +6,
  'faithful':   +3,
  'resonator':  -3,
  'collector':  -5,
};

export const __testing__ = { THREAD_BIAS_BY_ARCHETYPE } as const;
