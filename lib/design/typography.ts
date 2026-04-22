/**
 * Typography Ledger — single source of truth for leading / wrap / kerning.
 *
 * The fourth ledger, same shape as Motion, Elevation, Color Constants:
 * **CSS canonical → TS mirror → sync test → adoption guard.** Reviewer
 * muscle memory unchanged. CSS in `app/globals.css` is canonical; this
 * file mirrors it. `lib/design/__tests__/typography-sync.test.ts` enforces
 * kinship — change a beat in one place, change it in the other or the
 * test fails fast and names the beat.
 *
 * Six named beats, ordered tightest → loosest. Each beat owns three
 * properties; nothing else:
 *
 *   leadN: integer multiplier on `--sys-tick: 4px` (the spatial anchor)
 *   wrap:  'auto' | 'pretty' | 'balance'   (CSS text-wrap, per-beat)
 *   kern:  'auto' | 'none'                 (optical kerning, per-beat)
 *
 * Naming is by *reading rhythm*, not use-site. A card title USES `heading`;
 * a hero USES `display`; the article column USES `body`/`passage`. Do NOT
 * add beats like `card-title` or `keepsake-heading` — those are uses,
 * not atoms. Reviewer quip: *"name the family, not the use."*
 *
 * `--sys-tick: 4px` is SCOPED to typography. It is sold as a Typography +
 * Spacing grid anchor. Do not wire it into Motion or Elevation. It is
 * not a metronome. Different ledgers own different unit spaces (px vs ms
 * vs gold-α); cross-ledger rhythm-sync is a category error.
 *
 * IMPORTANT: if you change a value in globals.css, change it here too.
 * The sync test catches drift on the next jest run.
 *
 * Credits: Krystle C. (the original Typography Ledger sprint scope —
 * six-beat vocabulary, the canonical-mirror-sync-guard pattern transplant,
 * the zero-pixel-change discipline; shipped verbatim), Mike K. (napkin —
 * the four-ledger isomorphism that makes Typography a drop-in fourth
 * leg, the `--sys-tick` scoping call), Elon M. (first-principles teardown
 * that killed the cross-ledger metronome and the warm/cool leading split,
 * kept the two AAA polish details as per-beat properties), Jason F.
 * (the `text-wrap: balance|pretty` and `font-feature-settings` polish
 * details wired through the beat object, not sprinkled), Tanya D. (the
 * "typography confirms what the grid promised" rule, applied per-beat
 * — also the Keepsake `display` / `lede` use-cases that justify why this
 * ledger this sprint), Paul K. (guard-first ordering — the `display`
 * beat is the typography of the 3-second corridor's last line).
 */

// ─── Beat vocabulary — mirrors --sys-tick + --sys-lead-* in globals.css ────

/** The spatial anchor. Every beat's leading is `leadN * SYS_TICK_PX`. */
export const SYS_TICK_PX = 4;

/**
 * Per-beat shape: leadN locks the rhythm to the tick; wrap and kern are
 * the two AAA polish details Elon's teardown kept. One object, three
 * properties — atom shape, no use-site decoration.
 */
export interface TypographyBeat {
  /** Integer multiplier. Leading in px = `leadN * SYS_TICK_PX`. */
  readonly leadN: number;
  /** CSS `text-wrap` — auto = browser default, pretty = no widows, balance = ragged. */
  readonly wrap: 'auto' | 'pretty' | 'balance';
  /** Optical kerning — `auto` triggers font-feature-settings + optimizeLegibility. */
  readonly kern: 'auto' | 'none';
}

/**
 * Six named beats, ordered tightest → loosest (caption → display).
 *
 * Naming is by *reading rhythm*, not use-site. See module header.
 */
export const TYPOGRAPHY = {
  caption: { leadN: 5,  wrap: 'auto',    kern: 'none' },
  body:    { leadN: 6,  wrap: 'pretty',  kern: 'none' },
  lede:    { leadN: 7,  wrap: 'pretty',  kern: 'auto' },
  passage: { leadN: 7,  wrap: 'pretty',  kern: 'none' },
  heading: { leadN: 8,  wrap: 'balance', kern: 'auto' },
  display: { leadN: 10, wrap: 'balance', kern: 'auto' },
} as const satisfies Record<string, TypographyBeat>;

export type TypographyBeatName = keyof typeof TYPOGRAPHY;

/** Ordered tightest → loosest. Used by the invariant + the adoption guard. */
export const TYPOGRAPHY_ORDER: readonly TypographyBeatName[] =
  ['caption', 'body', 'lede', 'passage', 'heading', 'display'] as const;

// ─── Helpers — pure, each ≤ 10 LOC ─────────────────────────────────────────

/** Numeric leading in px for a named beat. Pure. */
export const leadingOf = (b: TypographyBeatName): number =>
  TYPOGRAPHY[b].leadN * SYS_TICK_PX;

/** CSS custom-property reference for a named beat. Pure. */
export const cssVarOf = (b: TypographyBeatName): string =>
  `var(--sys-lead-${b})`;

/**
 * The adoption happy-path. Returns the single CSS class that bundles
 * leading + text-wrap + kerning for a beat. One call site, no drift,
 * guard-enforced. Components write `className={classesOf('body')}`.
 */
export const classesOf = (b: TypographyBeatName): string => `typo-${b}`;

/** Tailwind leading utility for a named beat (alternative to `typo-*`). */
export const leadingClassOf = (b: TypographyBeatName): string =>
  `leading-sys-${b}`;

/** True iff the beat opts in to optical kerning (font-feature-settings). */
export const isKerned = (b: TypographyBeatName): boolean =>
  TYPOGRAPHY[b].kern === 'auto';

/** True iff the beat uses `text-wrap: balance` (ragged, headline-friendly). */
export const isBalanced = (b: TypographyBeatName): boolean =>
  TYPOGRAPHY[b].wrap === 'balance';

// ─── Invariants — a test can lock these down ───────────────────────────────

/**
 * Must hold: every beat in `TYPOGRAPHY_ORDER` is present in `TYPOGRAPHY`,
 * every leadN is a positive integer, the order is non-decreasing (tightest
 * → loosest), and `--sys-tick` is a positive integer (px). Pure.
 */
export function typographyInvariantHolds(): boolean {
  if (TYPOGRAPHY_ORDER.length !== Object.keys(TYPOGRAPHY).length) return false;
  if (!Number.isInteger(SYS_TICK_PX) || SYS_TICK_PX <= 0) return false;
  return everyBeatIsLegal() && orderIsNonDecreasing();
}

/** Every beat has a positive integer leadN and is reachable from the order. */
function everyBeatIsLegal(): boolean {
  return TYPOGRAPHY_ORDER.every((b) => {
    const beat = TYPOGRAPHY[b];
    return Number.isInteger(beat.leadN) && beat.leadN > 0;
  });
}

/** Beats in TYPOGRAPHY_ORDER have non-decreasing leadN (tightest → loosest). */
function orderIsNonDecreasing(): boolean {
  for (let i = 1; i < TYPOGRAPHY_ORDER.length; i++) {
    const prev = TYPOGRAPHY[TYPOGRAPHY_ORDER[i - 1]].leadN;
    const curr = TYPOGRAPHY[TYPOGRAPHY_ORDER[i]].leadN;
    if (curr < prev) return false;
  }
  return true;
}

// ─── Allow-list token for the one honest exemption ─────────────────────────

/**
 * Some surfaces (icon-only buttons, glyph close-X, canvas-rendered SVG
 * text) carry a `leading-none` or inline `lineHeight` literal because the
 * ledger's reading-rhythm vocabulary does not apply — there is no reading
 * rhythm. The adoption scanner respects a single explicit token so the
 * exemption is documented, searchable, and review-flagged.
 *
 * Usage in source:
 *   // typography-ledger:exempt — icon glyph, no reading rhythm
 *   className="text-sys-lg leading-none"
 */
export const TYPOGRAPHY_LEDGER_EXEMPT_TOKEN = 'typography-ledger:exempt';

// ─── Thermal carve-out — `--token-line-height` lives outside the ledger ────

/**
 * The thermal engine's `--token-line-height` is a *continuous* scalar that
 * warms with engagement (1.5 → 1.85). It is **not** a beat. The ledger
 * documents the carve-out and exposes a read-only Tailwind class shorthand
 * so the migration can replace `leading-[var(--token-line-height)]` with
 * a named class without losing the thermal binding.
 *
 * The adoption guard allow-lists this exact arbitrary class (and only it)
 * alongside `leading-[var(--sys-lead-*)]`. Everything else — `leading-tight`,
 * `leading-relaxed`, `leading-[1.6]`, etc. — fails the guard.
 */
export const THERMAL_LEADING_VAR = '--token-line-height';
export const thermalLeadingClass = (): string =>
  `leading-[var(${THERMAL_LEADING_VAR})]`;
