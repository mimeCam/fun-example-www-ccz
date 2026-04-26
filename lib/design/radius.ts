/**
 * Radius Ledger — single source of truth for `--sys-radius-*` across the site.
 *
 * **Reviewer rule (one question, four answers).** When reviewing a corner,
 * ask: *"what is this corner saying?"* If the answer is not a single word
 * from `{ label, held, ceremony, closure }`, the corner is wrong before
 * the pixel is wrong. Match the rung to the posture, then trust the pixel.
 * Pixel debates die; grammar replaces taste. (Tanya §4.2 / Paul's KPI.)
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
 * Posture vocabulary — the four words a reviewer is allowed to use to
 * describe what a corner is *saying*. Locked to four; matches `RADIUS_ORDER`
 * 1:1 (label↔soft, held↔medium, ceremony↔wide, closure↔full).
 *
 *   label    — "I am a small word about something else." (tags, badges)
 *   held     — "I am a contained thing you can act on."  (cards, toasts)
 *   ceremony — "I am a moment the reader presents."      (mirror, keepsake)
 *   closure  — "I am a shape that ends."                  (pills, hairlines)
 *
 * Tanya UX §2 (locked vocabulary). The bijection is asserted at jest time
 * by `radius-sync.test.ts`; a fifth posture is a TypeScript error before
 * it is a test failure.
 */
export type RadiusPosture = 'label' | 'held' | 'ceremony' | 'closure';

/**
 * Per-rung shape. `css` is the CSS value (rem for soft/medium/wide,
 * 9999px for full — the one non-rem rung because a pill is a closure,
 * not a length). `pxNominal` is documentation (rem × 16 when rem; raw
 * for `full`). `posture` is the typed reviewer-vocabulary word — promoted
 * from inline comment to compiler-enforced field per Mike's napkin §1
 * and Tanya §4.1. Nothing else — no name, no beat, no use-site.
 */
export interface RadiusRung {
  readonly css: string;
  readonly pxNominal: number;
  readonly posture: RadiusPosture;
}

/**
 * Four rungs, ordered tightest → loosest. Each rung carries its `posture`
 * as a typed field — autocompleted in IDEs, locked by the sync test, and
 * referenced by `postureOf()` / `rungByPosture()` for the inverse pair.
 */
export const RADIUS = {
  soft:   { css: '0.375rem', pxNominal: 6,    posture: 'label'    },
  medium: { css: '0.5rem',   pxNominal: 8,    posture: 'held'     },
  wide:   { css: '0.75rem',  pxNominal: 12,   posture: 'ceremony' },
  full:   { css: '9999px',   pxNominal: 9999, posture: 'closure'  },
} as const satisfies Record<string, RadiusRung>;

export type RadiusRungName = keyof typeof RADIUS;

/** Ordered tightest → loosest. Used by the invariant + adoption guard. */
export const RADIUS_ORDER: readonly RadiusRungName[] =
  ['soft', 'medium', 'wide', 'full'] as const;

/** Posture order, 1:1 with `RADIUS_ORDER`. The sync test asserts the bijection. */
export const RADIUS_POSTURE_ORDER: readonly RadiusPosture[] =
  ['label', 'held', 'ceremony', 'closure'] as const;

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
 * Posture-first alias of `radiusClassOf` — the reviewer answers
 * *"what is this corner saying?"* in posture vocabulary, this helper
 * resolves to the rung's `rounded-sys-*` class. Pure. Total over the
 * four-element posture domain (sync test guards the bijection).
 */
export const radiusClassByPosture = (p: RadiusPosture): string =>
  radiusClassOf(rungByPosture(p));

/**
 * Thermal-lifted variant — only `held` and `ceremony` carry a thermal
 * carve-out class today (`.thermal-radius`, `.thermal-radius-wide` in
 * `app/globals.css`). `label` and `closure` have no thermal corner by
 * design (Tanya §4 — radius is the slowest ledger). Pure, total over
 * its declared two-element domain.
 */
export const thermalRadiusClassByPosture = (
  p: Extract<RadiusPosture, 'held' | 'ceremony'>,
): string => (p === 'held' ? 'thermal-radius' : 'thermal-radius-wide');

/**
 * Thermal-lift CSS var reference — exposes `--token-radius-soft` to TS
 * callers who compose it (e.g. the mirrorRadiusBreathe keyframe).
 * `0rem` fallback matches the dormant anchor, making the carve-out
 * SSR-safe (ThermalProvider unmounted = zero lift). Pure.
 */
export const liftVar = (): string =>
  `var(--token-radius-soft, 0rem)`;

/** Posture word for a rung — pure, total, autocompletes in IDEs. */
export const postureOf = (r: RadiusRungName): RadiusPosture =>
  RADIUS[r].posture;

/**
 * Inverse of `postureOf`: rung name for a posture. Pure and total over
 * the four-element domain (the sync test asserts the bijection). Throws
 * only if someone strips a `posture` field at runtime — defensive guard,
 * not a normal control-flow path.
 */
export function rungByPosture(p: RadiusPosture): RadiusRungName {
  const r = RADIUS_ORDER.find((n) => RADIUS[n].posture === p);
  if (!r) throw new Error(`rungByPosture: no rung carries posture "${p}"`);
  return r;
}

// ─── Invariants — a test can lock these down ───────────────────────────────

/**
 * Must hold: four rungs exist, every rung's `css` is non-empty, rung
 * pxNominal values are strictly increasing (tightest → loosest),
 * `RADIUS_ORDER` covers exactly the four rung names, and `posture` is a
 * bijection onto `RADIUS_POSTURE_ORDER`. Pure.
 */
export function radiusInvariantHolds(): boolean {
  if (RADIUS_ORDER.length !== 4) return false;
  if (Object.keys(RADIUS).length !== 4) return false;
  return everyRungIsLegal()
    && orderIsStrictlyIncreasing()
    && postureIsBijection();
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

/** Posture forms a 1:1 mapping with `RADIUS_ORDER` (tightest → loosest). */
function postureIsBijection(): boolean {
  const postures = RADIUS_ORDER.map((r) => RADIUS[r].posture);
  if (new Set(postures).size !== RADIUS_POSTURE_ORDER.length) return false;
  return postures.every((p, i) => p === RADIUS_POSTURE_ORDER[i]);
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

// ─── Thermal-radius drift grandfather — shrinks one entry per PR ───────────

/**
 * Files that still ship a raw `.thermal-radius` / `.thermal-radius-wide`
 * class literal while the helper migration walks file-by-file. The
 * adoption guard fences NEW drift hard; this list grandfathers the
 * pre-migration callsites so the test stays green between graduations.
 *
 * Reviewer mantra: **decrement, do not add.** An entry leaves when the
 * file flips to `thermalRadiusClassByPosture(...)`. A PR that adds an
 * entry is failing the literacy contract — the fence exists to fail
 * loudly the moment a new corner becomes unspoken.
 *
 * Pre-MirrorReveal migration this list carried 7 entries; the killer-
 * feature surface's graduation drops it to 6. Counter (occurrences across
 * `.ts/.tsx/.css` source — Mike napkin §4): 13 → 12, then 12 → 11 with
 * the MirrorPair PR; ReturnLetter dropped 11 → 10 (5 → 4). This PR
 * (Mike napkin #92 / Tanya UX #100 §8) drops the counter further (10 → 9)
 * and the list (4 → 3) by graduating
 * `components/explore/ExploreArticleCard.tsx` — the cold-start surface's
 * two corners (Link focus-ring and inner article) now collapse into one
 * `THERM_HELD` posture binding, in one voice.
 *
 * The remaining 3 are solo corners. Mike's next-cadence order
 * (one per sprint, isolation-first): `MirrorLoadingSurface.tsx` →
 * `mirror/page.tsx` → `press-phase.ts`.
 */
export const THERMAL_RADIUS_GRANDFATHERED_PATHS: readonly string[] = [
  'app/mirror/page.tsx',
  'components/mirror/MirrorLoadingSurface.tsx',
  'lib/utils/press-phase.ts',
] as const;
