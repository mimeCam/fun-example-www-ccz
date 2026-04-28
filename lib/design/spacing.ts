/**
 * Spacing Ledger — single source of truth for `--sys-space-*` across the site.
 *
 * The fifth ledger, same shape as Motion, Elevation, Color Constants, Typography:
 * **CSS canonical → TS mirror → sync test → adoption guard.** Reviewer
 * muscle memory unchanged. CSS in `app/globals.css` is canonical; this
 * file mirrors it. `lib/design/__tests__/spacing-sync.test.ts` enforces
 * kinship — change a rung in one place, change it in the other or the
 * test fails fast and names the rung.
 *
 * Twelve numeric rungs, ordered tightest → loosest. Each rung owns two
 * properties; nothing else:
 *
 *   rem:       base value in rem (the unit space this ledger owns)
 *   pxNominal: rem × 16 — documentation only, not compiled into CSS
 *
 * Naming is *numeric on purpose*. No `breath` / `stanza` / `passage` beats:
 *   1. `passage` already means a Typography beat (`leadN: 7`) — same word,
 *      two ledgers, ambiguous grep, junior-trap. (Elon M., Tanya D.)
 *   2. Six named beats vs twelve numeric rungs is lossy for the 70+ live
 *      `sys-{6,9,11,12}` call-sites. (Elon M. §2)
 *   3. Cardinality six is symmetry-worship, not a derivation from the room.
 *
 * Vocabulary lives in the JSDoc below and the inline `/* 16px+ — standard *\/`
 * comments in `globals.css`. Compiler-reachable beats commit-theater.
 *
 * `--sys-tick: 4px` is SCOPED to Typography. Do **NOT** wire the tick into
 * this ledger — different ledgers own different unit spaces (rem vs 4px-tick
 * vs ms vs gold-α). Cross-ledger rhythm-sync is a category error.
 *
 * Thermal carve-out (`--token-space-lift-*`) is a **first-class citizen** of
 * this ledger, not a legacy exception. `liftVar(n)` exports it verbatim.
 * The `calc(rem + lift, 0px)` in CSS means the site still renders if
 * ThermalProvider never mounts (SSR, JS disabled).
 *
 * IMPORTANT: if you change a value in `app/globals.css`, change it here too.
 * The sync test catches drift on the next jest run.
 *
 * Credits: Krystle C. (original sprint shape — TS mirror + adoption guard,
 * the canonical-mirror-sync-guard pattern transplant, the ~40-site migration
 * discipline), Mike K. (napkin — the five-ledger isomorphism, the numeric-API
 * call, the thermal-as-first-class-citizen reframing, the `--sys-tick`
 * non-link rule), Elon M. (the kill-list that saved the sprint — dropped the
 * literary beats, the 12→6 lossiness, the `--sys-tick-space` duplication,
 * the `passage` collision), Tanya D. (the "typography confirms what the
 * grid promised" rule, the numeric-rungs vote, the layering rule that keeps
 * macro-space paired with a shadow beat), Paul K. (the make-or-break
 * outcome — one continuous breath across article / home / keepsake —
 * delivered by the adoption guard at the pixel level), Jason F. (the
 * thermal-as-namespace framing that survives as a single design-note line
 * exactly where he meant it to live).
 */

// ─── Rung vocabulary — mirrors --sys-space-1…12 in globals.css ─────────────

/**
 * Per-rung shape. `rem` is what the CSS compiles; `pxNominal` is
 * documentation (rem × 16). Nothing else — no name, no beat, no use-site.
 */
export interface SpacingRung {
  readonly rem: number;
  readonly pxNominal: number;
}

/**
 * Twelve rungs, ordered tightest → loosest. Inline comments carry the
 * human-readable vocabulary (`standard`, `generous`, `dramatic`) — they
 * are reviewer notes, not exported identifiers. Vocabulary in docs,
 * integers in code.
 */
export const SPACING_RUNGS: readonly SpacingRung[] = [
  { rem: 0.25,  pxNominal: 4  }, //  1 —  4px+ · tight
  { rem: 0.375, pxNominal: 6  }, //  2 —  6px+ · compact
  { rem: 0.5,   pxNominal: 8  }, //  3 —  8px+ · small
  { rem: 0.75,  pxNominal: 12 }, //  4 — 12px+ · medium
  { rem: 1,     pxNominal: 16 }, //  5 — 16px+ · standard
  { rem: 1.25,  pxNominal: 20 }, //  6 — 20px+ · comfortable
  { rem: 1.5,   pxNominal: 24 }, //  7 — 24px+ · generous
  { rem: 2,     pxNominal: 32 }, //  8 — 32px+ · section
  { rem: 2.5,   pxNominal: 40 }, //  9 — 40px+ · spacious
  { rem: 3,     pxNominal: 48 }, // 10 — 48px+ · dramatic
  { rem: 4,     pxNominal: 64 }, // 11 — 64px+ · monumental
  { rem: 6,     pxNominal: 96 }, // 12 — 96px+ · expansive
] as const;

/** Rung index — 1-based (matches `--sys-space-N` / `p-sys-N` conventions). */
export type SysSpaceIndex =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** Ordered tightest → loosest. Used by the invariant + adoption guard. */
export const SPACING_ORDER: readonly SysSpaceIndex[] =
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** The rem base anchor — 1rem = 16px (browser default, never remapped). */
export const REM_TO_PX = 16;

// ─── Helpers — pure, each ≤ 10 LOC ─────────────────────────────────────────

/** Rung record for a 1-based index. Pure. */
export const rungOf = (n: SysSpaceIndex): SpacingRung =>
  SPACING_RUNGS[n - 1];

/** CSS custom-property reference for a rung. Pure. */
export const spaceVar = (n: SysSpaceIndex): string =>
  `var(--sys-space-${n})`;

/**
 * Thermal-lift CSS var for a rung, with the `0px` fallback that makes the
 * whole ledger SSR-safe (ThermalProvider unmounted = zero lift). Pure.
 */
export const liftVar = (n: SysSpaceIndex): string =>
  `var(--token-space-lift-${n}, 0px)`;

/** Tailwind class shorthand (`p-sys-5`, `gap-sys-8`, …). Pure. */
export const spaceClassOf = (prop: string, n: SysSpaceIndex): string =>
  `${prop}-sys-${n}`;

// ─── Invariants — a test can lock these down ───────────────────────────────

/**
 * Must hold: twelve rungs exist, every rung's `pxNominal === rem × 16`,
 * rungs are strictly increasing (tightest → loosest), and `SPACING_ORDER`
 * covers exactly the twelve 1..12 indices. Pure.
 */
export function spacingInvariantHolds(): boolean {
  if (SPACING_RUNGS.length !== 12) return false;
  if (SPACING_ORDER.length !== 12) return false;
  return everyRungIsLegal() && orderIsStrictlyIncreasing();
}

/** Every rung's pxNominal matches rem × 16 and rem is a positive number. */
function everyRungIsLegal(): boolean {
  return SPACING_RUNGS.every(
    (r) => r.rem > 0 && r.pxNominal === r.rem * REM_TO_PX,
  );
}

/** Rungs grow strictly from tightest to loosest — no plateaus allowed. */
function orderIsStrictlyIncreasing(): boolean {
  for (let i = 1; i < SPACING_RUNGS.length; i++) {
    if (SPACING_RUNGS[i].rem <= SPACING_RUNGS[i - 1].rem) return false;
  }
  return true;
}

// ─── Allow-list token for the one honest exemption ─────────────────────────

/**
 * Some surfaces (foreign-DOM clipboard HTML, inline SVG/PNG geometry where
 * pixel literals are correct, CSS keyframe internals) cannot resolve
 * `var(--sys-space-N)`. The adoption scanner respects a single explicit
 * token so the exemption is documented, searchable, and review-flagged.
 *
 * Usage in source:
 *   // spacing-ledger:exempt — clipboard HTML, vars do not resolve
 *   const inline = 'padding: 16px;';
 */
export const SPACING_LEDGER_EXEMPT_TOKEN = 'spacing-ledger:exempt';

// ─── Thermal carve-out — first-class citizen, not a legacy exception ───────

/**
 * `--token-space-lift-N` is the thermal engine's additive lift that grows
 * with warmth score (0px at dormant → ~8px at luminous for macro rungs).
 * It is **part of the ledger**, not a carve-out — Paul's Tier-1 #2, Mike's
 * reframing in napkin §5.3. `liftVar(n)` above is how callers reach it.
 *
 * The adoption guard allow-lists `lib/thermal/thermal-tokens.ts` because
 * that's where the token strings are synthesised. Everything else — raw
 * `p-4`, `m-[16px]`, `style={{ padding: '1rem' }}` — fails the guard.
 */
export const THERMAL_LIFT_VAR_PREFIX = '--token-space-lift-';

// ─── Chassis seam — the chrome→content / content→chrome bridge ─────────────

/**
 * Canonical rung for the T1 / T3 chassis seam. One numeric rung, applied
 * symmetrically at the chrome→content (T1) and content→chrome (T3)
 * boundaries of every reader-facing route, so the first heading lands at
 * the same pixel row across `/`, `/articles`, `/article/[id]` — and the
 * last content element exhales the same air before `WhisperFooter`.
 * Mirror at top and bottom; one symbol, one rung.
 *
 * **Pick: rung 9 (40px+).** Justification:
 *
 *   1. *Tightens uniformly.* Today's seams sit at 24–96 px depending on
 *      route (`/` `py-sys-11 md:py-sys-12`, `/articles` `py-sys-10`,
 *      `/article/[id]` layered TopBar / ArticleHeader / divider). Rung 9
 *      brings every per-route seam at-or-below today's value — the change
 *      reads as "less air," never "where did this gap come from?". A
 *      loosening seam is the felt-jank we are removing (Mike #4 napkin
 *      §POI 1).
 *   2. *Sits between nav-bar height and the display beat lead-stack.*
 *      Calibrated against typography's display beat leading. The
 *      cross-ledger relationship is JSDoc only — never compiled coupling
 *      (the `--sys-tick` non-link rule, lines 27–29 above).
 *   3. *Existing surface support.* `--token-space-lift-9` already resolves
 *      via `liftVar(9)`; thermal warmth deepens the seam by the documented
 *      increment, no new motion verb required.
 *
 * **One rung, one named handle, four call sites.** The seam is always
 * applied at the *top edge* of the receiving element — the chrome→content
 * boundary lives at the top of each route body, and the content→chrome
 * boundary lives at the top of the universal `WhisperFooter`. So one
 * `pt-sys-N` handle covers all four sites; the route-body bottom is
 * collapsed into footer-owned T3 (Mike #4 napkin §3 — *"not both" is the
 * rule*; one site per seam, footer is universal so it wins T3).
 *
 * Naming is the rung-handle (`CHASSIS_SEAM_TOP_CLASS`) — *intent* (chrome
 * → content bridge) is grep-able, the rung is integer, the CSS var stays
 * `--sys-space-9`. No new var, no thirteenth rung, no `breathline` token.
 * Spacing-ledger naming rule (lines 17–23) holds. Vocabulary in docs,
 * integers in code (Elon M., Mike K. via Tanya UIX #4 §3.3).
 *
 * Call sites pinned by `lib/design/__tests__/chrome-content-seam.fence.test.ts`:
 *   • `app/page.tsx`                                (T1, `/`)
 *   • `components/articles/ArticlesPageClient.tsx`  (T1, `/articles`)
 *   • `app/article/[id]/page.tsx`                   (T1, with TopBar wrap-and-strip)
 *   • `components/shared/WhisperFooter.tsx`         (T3 — universal)
 *
 * Credits: Mike K. (architect — napkin #4, the rung-9 pick, the
 * tightening principle, the wrap-and-strip pattern for article-detail,
 * the "polymorphism is a killer" no-named-token rule), Tanya D. (UIX #4
 * — the cap-height anchor framing, the T1 = T3 mirror rule, the layer-
 * cleanup recommendations), Krystle C. (kernel — the original T1/T3
 * chassis-polish brief), Elon M. (the "no breathline name in tokens"
 * verdict that survives in the ledger), Sid (this implementation).
 */
export const CHASSIS_SEAM_RUNG: SysSpaceIndex = 9;

/**
 * Chassis-seam class — applied at the *top edge* of the element receiving
 * the seam. T1 (route-body top) and T3 (footer top) share this handle; the
 * rung lift travels with `--token-space-lift-9` for warmth. `pt-sys-9`.
 */
export const CHASSIS_SEAM_TOP_CLASS: string =
  spaceClassOf('pt', CHASSIS_SEAM_RUNG);
