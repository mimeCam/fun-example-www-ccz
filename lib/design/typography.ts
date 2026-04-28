import type { CSSProperties } from 'react';

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

/**
 * The wrap-only adoption handle. Returns the single CSS class that carries
 * a beat's `text-wrap` policy *without* its leading or kerning. The use
 * case is the whisper carriers — small italic `caption` text whose break
 * policy must be `heading`-balanced so a final word does not orphan at
 * 320px. The asymmetry (rhythm of one beat, wrap of another) is exactly
 * why this helper exists separately from `classesOf`.
 *
 * Each `.typo-wrap-<beat>` class declares ONLY `text-wrap: <wrap>`; it
 * does not touch line-height, letter-spacing, or font-feature-settings.
 * Composing `typo-caption` + `typo-wrap-heading` is therefore safe:
 * leading + track + kern stay caption; wrap is heading.
 *
 * Mike #122 §4 (the "Whisper Wrap" napkin): one literal, one home, one
 * grep-fence. Three whisper carriers consume `wrapClassOf('heading')`
 * without spelling `text-wrap-*` at the call site.
 *
 * Tailwind JIT contract: every literal `'typo-wrap-<beat>'` appears
 * verbatim in the switch below so the scanner emits each utility.
 */
export const wrapClassOf = (b: TypographyBeatName): string => {
  switch (b) {
    case 'caption': return 'typo-wrap-caption';
    case 'body':    return 'typo-wrap-body';
    case 'lede':    return 'typo-wrap-lede';
    case 'passage': return 'typo-wrap-passage';
    case 'heading': return 'typo-wrap-heading';
    case 'display': return 'typo-wrap-display';
  }
};

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

// ─── Numeric features — SVG/canvas register, DOM uses <CaptionMetric> ──────

/**
 * Tabular + lining figures, raw CSS string for SVG/canvas surfaces only.
 *
 * The DOM register lives on `<CaptionMetric>` (in `components/shared/`),
 * which carries the `tabular-nums` Tailwind utility plus
 * `tracking-sys-caption` plus the alpha-ledger `quiet` rung. **Reach for
 * `<CaptionMetric>` from any `.tsx` render tree.** This export exists for
 * the one register where Tailwind classes do not apply — server-built
 * SVG strings (and, in principle, `<canvas>` text) where the keepsake's
 * date and stats lines must align byte-stably across readers.
 *
 * Why a literal const, not a template string: reviewer muscle memory from
 * `CaptionMetric.tsx` — JIT/byte-identity-stable consumers must see a
 * STATIC string at parse time. `'tnum' 1` aligns advance widths so digits
 * share a column; `'lnum' 1` forces lining figures so 0–9 share baseline
 * and cap-height (load-bearing on the keepsake's display-size attribution
 * — do not drop). Single-quoted feature tags so consumers can embed this
 * inside double-quoted SVG attributes without escaping (Tanya #90 §3.7).
 *
 * Adoption guard: `lib/design/__tests__/numeric-features-adoption.test.ts`
 * fails CI if any module other than this ledger or `<CaptionMetric>`
 * spells the `font-feature-settings.*tnum|lnum` literal or the
 * `fontVariantNumeric` React style key. The two homes are the registry.
 *
 * Mike #77 §5.1: *Name the CSS, not the cosmology.* No "Cross-Reader
 * Stasis" rename — the mechanism is `tnum`/`lnum` typography.
 */
export const NUMERIC_FEATURE_SETTINGS =
  "font-feature-settings: 'tnum' 1, 'lnum' 1";

/**
 * Returns the same literal as a leading semicolon-free fragment suitable
 * for direct interpolation inside an SVG `style="…"` attribute. Pure,
 * ≤ 10 LOC, no allocation per call. The two SVG sites in the keepsake
 * builder use this; nothing else should.
 *
 * Example (SVG, server build):
 *   `<text style="${numericFeatureStyle()}">…</text>`
 */
export const numericFeatureStyle = (): string => NUMERIC_FEATURE_SETTINGS;

// ─── Filled-glyph optical lift — chip-baseline polish ──────────────────────

/**
 * Tailwind utility pair that lifts filled-ink glyphs by 0.5px so they
 * rest on the same x-height as line glyphs at `text-sys-micro`.
 *
 * The mechanism is **filled-glyph centroid drift at micro text**: filled
 * glyphs (`▣`, `◉`, `❒`) carry their ink-density centre BELOW the
 * optical line, so they read as visibly sunk vs line-only siblings
 * (`◇`, `◯`, `→`, `≈`, `✦`). A single −0.5px lift brings the filled
 * three onto the same baseline rhythm. This constant is the **default**
 * for that compensation.
 *
 * Per-glyph aesthetic veto is preserved at the surface manifest. `▲`
 * (worldview/practical) is the documented exception: its downward point
 * already reads as forward motion (Tanya UX #10 §4.1), so the worldview
 * surface omits it from `WORLDVIEW_GLYPH_NUDGE`. Lift policy is per-glyph
 * optical centroid, **not** "every filled glyph." A future filled glyph
 * whose drift is not visually compensated by its outline opts in via the
 * `*_GLYPH_NUDGE` map at its surface's manifest.
 *
 * **Sub-pixel rendering caveat:** `-top-[0.5px]` may quantize to 0 on a
 * 1× display with subpixel anti-aliasing disabled. This is acceptable —
 * the lift is *at most* a 0.5px improvement; when it quantizes away the
 * chip is no worse than today. This is the source-level token, not a
 * paint receipt; a paint-byte audit is a sibling concern on a different
 * branch of the test taxonomy (Mike napkin §4.5, Tanya §4.3).
 *
 * **JIT contract:** the literal `relative -top-[0.5px]` must appear
 * verbatim in source for Tailwind's JIT scanner to emit the utility.
 * Tailwind scans `lib/**\/*.ts`, so the literal in this export is
 * sufficient — both consumer ledgers may import the constant by name
 * without re-spelling the string. No template interpolation in the
 * literal itself.
 *
 * Adoption guard: `lib/design/__tests__/filled-glyph-lift-adoption.test.ts`
 * fails CI if any module other than this ledger spells the literal
 * `relative -top-[0.5px]`. The two consumer manifests
 * (`lib/design/worldview.ts`, `lib/design/archetype-accents.ts`) reach
 * for the constant by name; a third home flips the fence red and names
 * the legal exits.
 *
 * Mike napkin: *one literal, three legal homes (one export + two
 * consumers), one grep-fence — named after the physics, shaped exactly
 * like `NUMERIC_FEATURE_SETTINGS`.* No "handshake" cosmology — N=1 is
 * not a category (Elon §2.1).
 *
 * Credits: Krystle C. (the original DRY scope: one literal, two homes,
 * one adoption guard), Mike K. (napkin §4.1 — name the physics not the
 * cosmology, §4.4 — JIT-emission is load-bearing, §4.6 — refuse the
 * handshake category at N=1), Elon M. (#76 §3.1/§3.2 — sub-pixel
 * caveat, the `▲` carve-out honesty), Tanya D. (#62 §4.1 — the per-
 * glyph optical-baseline nudge, #62 §4.2 — the symmetric `align-
 * baseline` chip-rest fix, §4.1 — the `▲`-as-aesthetic-veto admission).
 */
export const FILLED_GLYPH_OPTICAL_LIFT_CLASS = 'relative -top-[0.5px]';

// ─── Baseline nudge by glyph — typed map keyed by glyph name (N=2) ─────────

/**
 * Frozen `CSSProperties` literals keyed by glyph name. Each member lifts
 * an inline glyph by `verticalAlign: 0.08em` so its centroid lands on the
 * surrounding x-height instead of the em-box centre.
 *
 * **Why 0.08em is physics, not taste.** Two distinct glyphs share the same
 * symptom: their centroid sits below the surrounding line's x-height by
 * ~1.5–2px at micro text. (1) `externalGlyph` — the 10×10 viewBox SVG
 * external-link arrow inside `<TextLink>`'s `<ExternalGlyph>`. (2)
 * `middleDot` — the U+00B7 separator inside `<WhisperFooter>`'s `<FooterDot>`,
 * whose centroid rests on the em-box centre rather than the labels' x-line.
 * Without naming the nudge, a future refactor will "simplify" it to zero
 * and the glyphs will read as floating low.
 *
 * **Two legal consumers.** `<ExternalGlyph>` in `components/shared/TextLink.tsx`
 * (key `externalGlyph`); `<FooterDot>` in `components/shared/WhisperFooter.tsx`
 * (key `middleDot`). Adoption guard at
 * `lib/design/__tests__/baseline-nudge-adoption.test.ts` traps any other
 * module that spells `verticalAlign: '0.08em'`.
 *
 * **Frozen by reference.** Each member is byte-stable across renders, so
 * React inlines `BASELINE_NUDGE_BY_GLYPH.middleDot` without per-render
 * allocation. Do NOT unwrap into a literal at the call site — that's the
 * whole point of the map. No JIT coupling — `vertical-align` is an inline
 * style, not a Tailwind class.
 *
 * **Why not Tailwind.** `align-[0.08em]` maps to `align-items`, not to
 * `vertical-align`. There is no first-class Tailwind utility for arbitrary
 * `vertical-align` values, and inventing one for a single call site would
 * be a heavier JIT-coupled detour. A frozen `CSSProperties` literal is the
 * smaller, honest shape.
 *
 * **Sub-pixel caveat.** At `text-sys-micro` (11px), 0.08em ≈ 0.88px. On a
 * 1× display with subpixel anti-aliasing disabled, the lift may quantize
 * to 0; the glyph is no worse than today in that case (Mike #100 §4.5 /
 * Tanya §4.3 — source-token vs paint-receipt is a category split).
 *
 * **N=2 is a typed table, not a taxonomy.** Adding a third key requires a
 * real third use-site, not a placeholder. Shape follows data, not data
 * shape — Mike's napkin: *one literal, one home, one fence — name the
 * physics, not the cosmology.*
 */
export const BASELINE_NUDGE_BY_GLYPH = {
  externalGlyph: { verticalAlign: '0.08em' },
  middleDot:     { verticalAlign: '0.08em' },
} as const satisfies Readonly<Record<string, Readonly<CSSProperties>>>;

/** Glyph names with a registered baseline nudge. */
export type BaselineNudgeGlyph = keyof typeof BASELINE_NUDGE_BY_GLYPH;
