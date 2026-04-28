/**
 * Swap-Width — three discrete `min-width` floors for label-swapping action hosts.
 *
 * `<ActionPressable>` callers crossfade `idleLabel` ↔ `settledLabel` (Copy ↔
 * Copied, Share this card ↔ Shared, …). Without a `min-width` floor on the
 * host, the verb-tense swap reflows the bounding box by ~6 px and the
 * sibling controls drift right. Three different magic numbers were hand-
 * rolled across three call sites with three different `min-w-[Xrem]`
 * literals — rule of three has fired (Mike #39 §1).
 *
 * This facet is a small, focused module — NOT a row in `spacing.ts` (the
 * eight ledgers stay eight; Paul Tier-1 #2). Different unit-space:
 * `spacing.ts` owns rem-on-the-12-rung continuum; `swap-width` owns three
 * discrete content-derived floors. NOT a verb-primitive: a `min-width`
 * constraint performs no action; calling it a verb-primitive dilutes the
 * vocabulary `<Threshold>` / `<Pressable>` / `<ActionPressable>` /
 * `<LeanArrow>` paid to establish (Elon §3).
 *
 * The same canonical-mirror-sync-guard pattern that protects spacing,
 * motion, elevation, color, typography:
 *
 *   CSS (`--label-swap-width-N`)  →  TS mirror (`SWAP_WIDTH_RUNGS`)
 *      ↑ canonical                       ↓
 *   sync test                       fence test
 *   (drift = fail)                  (forbid `min-w-[Xrem]` on
 *                                    `<ActionPressable>` hosts)
 *                                  +
 *                                   adoption test
 *                                   (forbid the three rung literals
 *                                    outside the canonical home)
 *
 * Three rungs, derived from the longest-settled-label per host. The five
 * compositional carriers (Mike #94 §2.1 — JSDoc on `<ActionPressable>` is
 * the source of truth for *which file* speaks each rung) land as follows:
 *
 *   rung 1 — `Copied` (6 ch)              → 5.5rem · ReturnLetter Copy
 *                                                  · Quote/ThreadKeepsake
 *                                                    SecondaryAction × 3 each
 *   rung 2 — `Copy Link` ↔ `Copied!`      → 6.5rem · ShareOverlay tooltip
 *   rung 3 — `Share this card`/`thread`   → 14rem  · Quote/ThreadKeepsake
 *                                                    primary CTA
 *
 *   exempt — icon-only hosts with `labelMode='hidden'` (no label swap, glyph
 *            byte-identical at size 14): ShareOverlay CopyLinkBtn,
 *            SelectionShareTrigger. See `// swap-width:exempt` tokens in source.
 *
 * No build-time codegen pipeline (Mike #39 §3, Paul §5): three documented
 * constants whose source labels live in JSDoc on each rung. If `Copying…`
 * ever ships and truncates, the host fence catches the new `min-w-[Xrem]`
 * and forces an update through this helper. Frequency does not justify
 * infrastructure (Elon Gap 4).
 *
 * Helpers are pure, ≤ 10 LOC each. The class returned by
 * `swapWidthClassOf(n)` is a Tailwind arbitrary-value literal so the JIT
 * sees every literal in source — same lesson `alphaClassOf` paid for.
 *
 * Credits: Mike K. (#39 napkin — module placement as a focused facet not a
 * spacing-row, naming `swap-width` over `pin`, kernel-first fence shape,
 * "no codegen this cycle" call), Tanya D. (UX #41 — the chamber-holds
 * felt sentence, the three-rung sizing table derived from labels not chars,
 * the centring discipline, the ✕ list), Krystle C. (rule-of-three trigger,
 * Axis F authorship, fence-scope-to-action-hosts call), Elon M. (kill list:
 * dropped doctrine, refused verb-primitive promotion, named the
 * literary-name war already settled, flagged `pin` as overloaded), Paul K.
 * (DoD shape, anti-scope discipline), Sid (this lift — 30-LOC core, four
 * one-line JSX edits, byte-identical class output to keep the diff small).
 */

// ─── Rung vocabulary — mirrors --label-swap-width-1..3 in globals.css ──────

/**
 * Per-rung shape. `rem` is what compiles into the CSS custom property and
 * the `min-w-[Xrem]` Tailwind class; `pxNominal` is documentation only
 * (rem × 16). Nothing else — no name, no beat, no use-site (mirrors the
 * `SpacingRung` shape for reviewer muscle-memory).
 */
export interface SwapWidthRung {
  readonly rem: number;
  readonly pxNominal: number;
}

/**
 * Three rungs, derived from the longest settled label per host.
 *
 *   rung 1 — `Copied` (6 ch);            host: ReturnLetter Copy
 *   rung 2 — `Copy Link`/`Copied!` (≤9); host: ShareOverlay tooltip
 *   rung 3 — `Share this card` (15 ch);  host: Quote/ThreadKeepsake primary
 */
export const SWAP_WIDTH_RUNGS: readonly SwapWidthRung[] = [
  { rem: 5.5, pxNominal: 88  }, // 1 — derived from "Copied" (6 ch)
  { rem: 6.5, pxNominal: 104 }, // 2 — derived from "Copy Link" / "Copied!"
  { rem: 14,  pxNominal: 224 }, // 3 — derived from "Share this card"
] as const;

/** Rung index — 1-based (matches `--label-swap-width-N` convention). */
export type SwapWidthIndex = 1 | 2 | 3;

/** Ordered tightest → loosest. Used by the invariant + adoption guard. */
export const SWAP_WIDTH_ORDER: readonly SwapWidthIndex[] = [1, 2, 3] as const;

/** The rem base anchor — 1rem = 16px (browser default, never remapped). */
export const SWAP_REM_TO_PX = 16;

// ─── Helpers — pure, each ≤ 10 LOC ─────────────────────────────────────────

/** Rung record for a 1-based index. Pure. */
export const swapWidthRungOf = (n: SwapWidthIndex): SwapWidthRung =>
  SWAP_WIDTH_RUNGS[n - 1];

/** CSS custom-property reference for a rung. Pure. */
export const swapWidthVar = (n: SwapWidthIndex): string =>
  `var(--label-swap-width-${n})`;

/**
 * Tailwind arbitrary-value `min-w-[Xrem]` class for a rung. Pure.
 * Returns a JIT-visible literal (no template interpolation of the rem
 * value through Tailwind) — the helper composes the same string the
 * call-sites used to hand-roll, so byte-identity of rendered HTML is
 * preserved on first iteration (Mike #39 POI-8).
 */
export const swapWidthClassOf = (n: SwapWidthIndex): string =>
  `min-w-[${swapWidthRungOf(n).rem}rem]`;

// ─── Invariants — a test can lock these down ───────────────────────────────

/**
 * Must hold: three rungs exist, every rung's `pxNominal === rem × 16`,
 * rungs are strictly increasing (tightest → loosest), and `SWAP_WIDTH_ORDER`
 * covers exactly the three 1..3 indices. Pure.
 */
export function swapWidthInvariantHolds(): boolean {
  if (SWAP_WIDTH_RUNGS.length !== 3) return false;
  if (SWAP_WIDTH_ORDER.length !== 3) return false;
  return everySwapRungIsLegal() && swapOrderIsStrictlyIncreasing();
}

/** Every rung's pxNominal matches rem × 16 and rem is a positive number. */
function everySwapRungIsLegal(): boolean {
  return SWAP_WIDTH_RUNGS.every(
    (r) => r.rem > 0 && r.pxNominal === r.rem * SWAP_REM_TO_PX,
  );
}

/** Rungs grow strictly from tightest to loosest — no plateaus allowed. */
function swapOrderIsStrictlyIncreasing(): boolean {
  for (let i = 1; i < SWAP_WIDTH_RUNGS.length; i++) {
    if (SWAP_WIDTH_RUNGS[i].rem <= SWAP_WIDTH_RUNGS[i - 1].rem) return false;
  }
  return true;
}

// ─── Allow-list token for honest exemptions ────────────────────────────────

/**
 * Some hosts may legitimately need a one-off `min-w-[Xrem]` — for example,
 * a temporary tolerate path during a multi-PR migration. The fence respects
 * a single explicit token so the exemption is documented, searchable, and
 * review-flagged.
 *
 * Usage in source:
 *   // swap-width:exempt — <reason>
 *   <ActionPressable className="min-w-[8rem]" … />
 */
export const SWAP_WIDTH_EXEMPT_TOKEN = 'swap-width:exempt';
