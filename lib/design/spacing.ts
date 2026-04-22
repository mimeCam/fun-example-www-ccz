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
