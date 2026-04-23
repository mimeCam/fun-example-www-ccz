/**
 * Radius Ledger — single source of truth for `--sys-radius-*` across the site.
 *
 * The sixth **module** in `lib/design/` (motion · elevation · color-constants ·
 * typography · spacing · radius). The rung count is **four**, not six — do not
 * conflate module count with rung cardinality. The four rungs are
 * `soft · medium · wide · full`; the fifth rung is the first crack.
 *
 * Same shape as the five existing ledgers:
 * **CSS canonical → TS mirror → sync test → adoption guard.** Reviewer
 * muscle memory unchanged. CSS in `app/globals.css` is canonical; this
 * file mirrors it. `lib/design/__tests__/radius-sync.test.ts` enforces
 * kinship — change a value in one place, change it in the other or the
 * test fails fast and names the rung.
 *
 * Four named rungs, ordered tightest → loosest:
 *
 *   soft    6px   — tags, badges, tooltips, small labels
 *   medium  8px   — cards, buttons, inputs (the "held" default)
 *   wide    12px  — mirror card, keepsake, hero surfaces that present
 *   full    pill  — avatars, progress bars, hairline dots, closure
 *
 * Rung vocabulary is by *posture*, not use-site. A card USES `medium`;
 * a pill USES `full`. Do NOT add rungs like `card-radius` or `pill-radius`
 * — those are uses, not atoms.
 *
 * Radius is the **slowest-moving ledger**: it does not warm with engagement
 * on cards, buttons, or layout containers. The `--token-radius-soft` thermal
 * carve-out lives solely to drive the `mirrorRadiusBreathe` hero keyframe —
 * one documented exempt moment, per Tanya §4. `liftVar()` exposes it so that
 * exemption is reachable from TS without a string literal.
 *
 * IMPORTANT: if you change a value in `app/globals.css`, change it here too.
 * The sync test catches drift on the next jest run.
 *
 * Credits: Mike K. (napkin — the pattern-isomorphism call lifted from
 * spacing.ts/elevation.ts, the four-rung cardinality guard, the
 * thermal-as-first-class-citizen reframing via `liftVar()`, the 6-file
 * scope cap), Tanya D. (UX spec — the four rungs and their emotional
 * role, the "radius is the room's constant posture" rule, the one-carve-
 * out hero beat for `mirrorRadiusBreathe`, the §5 per-site feel for the
 * three drift sites), Paul K. (make-or-break outcome — invisible
 * tightening, reader-trust compounds through micro-polish), Elon M.
 * (first-principles teardown — caught the cardinality lie and the "curvature
 * stays constant" contradiction, both resolved here), Krystle C. (the
 * original five-ledger sprint shape that this sixth module is a literal
 * isomorphism of).
 */

// ─── Rung vocabulary — mirrors --sys-radius-* in globals.css ───────────────

/**
 * Per-rung shape. `css` is the CSS value (rem for soft/medium/wide,
 * 9999px for full — the one non-rem rung because a pill is a closure,
 * not a length). `pxNominal` is documentation (rem × 16 when rem; raw
 * for `full`). Nothing else — no name, no beat, no use-site.
 */
export interface RadiusRung {
  readonly css: string;
  readonly pxNominal: number;
}

/**
 * Four rungs, ordered tightest → loosest. Inline comments carry the
 * human-readable posture (`label`, `held`, `ceremony`, `closure`) —
 * they are reviewer notes, not exported identifiers. Vocabulary in docs,
 * named keys in code.
 */
export const RADIUS = {
  soft:   { css: '0.375rem', pxNominal: 6    }, //  6px — label  · tags, badges
  medium: { css: '0.5rem',   pxNominal: 8    }, //  8px — held   · cards, buttons, inputs
  wide:   { css: '0.75rem',  pxNominal: 12   }, // 12px — ceremony · mirror card, keepsake
  full:   { css: '9999px',   pxNominal: 9999 }, // pill — closure · avatars, pills, hairlines
} as const satisfies Record<string, RadiusRung>;

export type RadiusRungName = keyof typeof RADIUS;

/** Ordered tightest → loosest. Used by the invariant + adoption guard. */
export const RADIUS_ORDER: readonly RadiusRungName[] =
  ['soft', 'medium', 'wide', 'full'] as const;

/** The rem base anchor — 1rem = 16px (browser default, never remapped). */
export const REM_TO_PX = 16;

// ─── Helpers — pure, each ≤ 10 LOC ─────────────────────────────────────────

/** Rung record for a named key. Pure. */
export const rungOf = (r: RadiusRungName): RadiusRung => RADIUS[r];

/** CSS custom-property reference for a rung. Pure. */
export const cssVarOf = (r: RadiusRungName): string =>
  `var(--sys-radius-${r})`;

/** Tailwind class shorthand (`rounded-sys-medium`, …). Pure. */
export const radiusClassOf = (r: RadiusRungName): string =>
  `rounded-sys-${r}`;

/**
 * Thermal-lift CSS var reference — exposes `--token-radius-soft` to TS
 * callers who compose it (e.g. the mirrorRadiusBreathe keyframe).
 * `0rem` fallback matches the dormant anchor, making the carve-out
 * SSR-safe (ThermalProvider unmounted = zero lift). Pure.
 */
export const liftVar = (): string =>
  `var(--token-radius-soft, 0rem)`;

// ─── Invariants — a test can lock these down ───────────────────────────────

/**
 * Must hold: four rungs exist, every rung's `css` is non-empty, rung
 * pxNominal values are strictly increasing (tightest → loosest), and
 * `RADIUS_ORDER` covers exactly the four rung names. Pure.
 */
export function radiusInvariantHolds(): boolean {
  if (RADIUS_ORDER.length !== 4) return false;
  if (Object.keys(RADIUS).length !== 4) return false;
  return everyRungIsLegal() && orderIsStrictlyIncreasing();
}

/** Every rung has a non-empty css value and a positive pxNominal. */
function everyRungIsLegal(): boolean {
  return RADIUS_ORDER.every((r) => {
    const rung = RADIUS[r];
    return rung.css.length > 0 && rung.pxNominal > 0;
  });
}

/** Rungs grow strictly tightest to loosest — no plateaus. */
function orderIsStrictlyIncreasing(): boolean {
  for (let i = 1; i < RADIUS_ORDER.length; i++) {
    const a = RADIUS[RADIUS_ORDER[i - 1]].pxNominal;
    const b = RADIUS[RADIUS_ORDER[i]].pxNominal;
    if (b <= a) return false;
  }
  return true;
}

// ─── Allow-list token for the honest exemptions ────────────────────────────

/**
 * Some surfaces cannot resolve `var(--sys-radius-*)`: foreign-DOM toasts
 * (clipboard HTML, inline-injected divs that may mount before ThermalProvider)
 * and CSS keyframe internals. The adoption scanner respects a single explicit
 * token so each exemption is documented, searchable, and review-flagged.
 *
 * Usage in source:
 *   // radius-ledger:exempt — foreign-DOM toast, CSS vars do not resolve
 *   const inline = 'border-radius: 0.75rem;';
 */
export const RADIUS_LEDGER_EXEMPT_TOKEN = 'radius-ledger:exempt';

// ─── Thermal carve-out — hero-only, NOT a global utility ───────────────────

/**
 * `--token-radius-soft` is the one thermal radius knob. Unlike the other
 * thermal tokens (color, line-height, spacing-lift) it does NOT modulate
 * general chrome — cards, buttons, and containers keep a constant radius
 * regardless of the reader's thermal score. The single consumer is the
 * `mirrorRadiusBreathe` keyframe at globals.css:458–465, which breathes
 * the mirror card's corner by +4px during shimmer and settles back.
 *
 * One hero moment, one variable, one exempt keyframe. Tanya §4.
 */
export const THERMAL_RADIUS_VAR = '--token-radius-soft';

/**
 * The one keyframe allowed to compose `var(--sys-radius-*)` with
 * `var(--token-radius-soft)`. The adoption guard treats it as the
 * single documented hero carve-out; anything else in CSS using that
 * token is drift.
 */
export const MIRROR_BREATHE_KEYFRAME = 'mirrorRadiusBreathe';
