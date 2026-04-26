/**
 * Typography Ledger — single source of truth for leading / wrap / kerning / track.
 *
 * The fourth ledger, same shape as Motion, Elevation, Color Constants:
 * **CSS canonical → TS mirror → sync test → adoption guard.** Reviewer
 * muscle memory unchanged. CSS in `app/globals.css` is canonical; this
 * file mirrors it. `lib/design/__tests__/typography-sync.test.ts` enforces
 * kinship — change a beat in one place, change it in the other or the
 * test fails fast and names the beat.
 *
 * Six named beats, ordered tightest → loosest. Each beat owns four
 * properties; nothing else:
 *
 *   leadN: integer multiplier on `--sys-tick: 4px` (the spatial anchor)
 *   wrap:  'auto' | 'pretty' | 'balance'   (CSS text-wrap, per-beat)
 *   kern:  'auto' | 'none'                 (optical kerning, per-beat)
 *   track: number (em)                     (letter-spacing, voice-print anchor)
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
 * the two AAA polish details Elon's teardown kept; track is the voice-print
 * anchor (letter-spacing in em). One object, four properties — atom shape,
 * no use-site decoration. `track` does not warm with engagement; the
 * reader's voice-print refuses to breathe. See AGENTS.md for the one-line
 * per-property thermal declaration.
 */
export interface TypographyBeat {
  /** Integer multiplier. Leading in px = `leadN * SYS_TICK_PX`. */
  readonly leadN: number;
  /** CSS `text-wrap` — auto = browser default, pretty = no widows, balance = ragged. */
  readonly wrap: 'auto' | 'pretty' | 'balance';
  /** Optical kerning — `auto` triggers font-feature-settings + optimizeLegibility. */
  readonly kern: 'auto' | 'none';
  /** Letter-spacing in em (-0.2 … +0.2). Anchor property — does not warm. */
  readonly track: number;
}

/**
 * Six named beats, ordered tightest → loosest (caption → display).
 *
 * Naming is by *reading rhythm*, not use-site. See module header.
 *
 * `track` values:
 *   caption  +0.08em  stage-whisper — uppercase labels, marginalia, kickers
 *   body      0em     neutral — prose paragraphs
 *   lede      0em     neutral — optical kerning carries the polish
 *   passage   0em     neutral — long-form reading
 *   heading  -0.01em  tighter — card titles, section heads
 *   display  -0.02em  tightest — hero, keepsake artifact
 */
export const TYPOGRAPHY = {
  caption: { leadN: 5,  wrap: 'auto',    kern: 'none', track:  0.08 },
  body:    { leadN: 6,  wrap: 'pretty',  kern: 'none', track:  0    },
  lede:    { leadN: 7,  wrap: 'pretty',  kern: 'auto', track:  0    },
  passage: { leadN: 7,  wrap: 'pretty',  kern: 'none', track:  0    },
  heading: { leadN: 8,  wrap: 'balance', kern: 'auto', track: -0.01 },
  display: { leadN: 10, wrap: 'balance', kern: 'auto', track: -0.02 },
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

/** Track (letter-spacing, em) for a named beat. Pure. */
export const trackOf = (b: TypographyBeatName): number =>
  TYPOGRAPHY[b].track;

/** CSS custom-property reference for a beat's track. Pure. */
export const cssTrackVarOf = (b: TypographyBeatName): string =>
  `var(--sys-track-${b})`;

/** Tailwind tracking utility for a named beat (alternative to `typo-*`). */
export const trackingClassOf = (b: TypographyBeatName): string =>
  `tracking-sys-${b}`;

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

/** Every beat has positive integer leadN, finite bounded track — reachable from order. */
function everyBeatIsLegal(): boolean {
  return TYPOGRAPHY_ORDER.every((b) => {
    const beat = TYPOGRAPHY[b];
    const legalLead = Number.isInteger(beat.leadN) && beat.leadN > 0;
    const legalTrack = Number.isFinite(beat.track) && Math.abs(beat.track) <= 0.2;
    return legalLead && legalTrack;
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
 * warms with engagement (1.75 → 1.95 on body prose). It is **not** a beat
 * — beats are static; this is the carve-out. `--token-letter-spacing`
 * (-0.01em → +0.02em) is its tracking sibling. Both bind together in one
 * named class — `typo-passage-thermal` — so body prose has *one* ledger
 * handle, not two arbitrary literals.
 *
 * The PRIMARY thermal signal is line-height (Tanya D., spec at
 * `lib/thermal/thermal-tokens.ts:25–27`). Tracking is the body-prose
 * carve-out (same family-vs-register shape as `passage` vs `passage-thermal`).
 *
 * The adoption guard tolerates the legacy arbitrary `leading-[var(--token-line-height)]`
 * inside this module only (the helper below) for back-compat documentation;
 * components migrate to `passageThermalClass()`.
 */
export const THERMAL_LEADING_VAR = '--token-line-height';
export const thermalLeadingClass = (): string =>
  `leading-[var(${THERMAL_LEADING_VAR})]`;

/**
 * The named ledger handle for the thermal reading-rhythm carve-out.
 * Same family as `passage` (wrap: pretty); binds to `--token-line-height`
 * and `--token-letter-spacing` instead of the static `--sys-lead-passage`
 * / `--sys-track-passage`. Resolves to the canonical CSS class
 * `.typo-passage-thermal` defined in `app/globals.css`.
 *
 * Components write `className={passageThermalClass()}` on body prose
 * surfaces (article body paragraphs, archetype extensions, resonance
 * marginalia, resonance archive notes). The static `passage` register
 * is reserved for non-thermal surfaces (archive previews, thread cards,
 * metadata blocks where engagement is not measured).
 *
 * Reviewer mnemonic: *passage is the rhythm; thermal is the breath.*
 */
export const passageThermalClass = (): string => 'typo-passage-thermal';

// ─── Thermal carve-out — `--token-letter-spacing` is the BODY prose scalar ──

/**
 * The thermal engine's `--token-letter-spacing` warms body prose only
 * (-0.01em → +0.02em with engagement). It is **not** a beat. `track` is
 * the anchor register; `--token-letter-spacing` is the thermal carve-out
 * on body text (analogous to `--token-line-height`).
 *
 * Declaration per property (AGENTS.md): `track` does not warm; body-prose
 * `--token-letter-spacing` is the single thermal carve-out, same shape
 * as `--token-line-height` vs. `leadN`. Bound by `passageThermalClass()`.
 */
export const THERMAL_TRACK_VAR = '--token-letter-spacing';
export const thermalTrackClass = (): string =>
  `tracking-[var(${THERMAL_TRACK_VAR})]`;
