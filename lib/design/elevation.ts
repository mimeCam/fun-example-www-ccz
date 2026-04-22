/**
 * Elevation Ledger — single source of truth for shadow / depth across the site.
 *
 * CSS (`app/globals.css`) is canonical. TypeScript mirrors it.
 * `lib/design/__tests__/elevation-sync.test.ts` enforces kinship. If a number
 * changes in one place it must change in the other — or the test fails.
 *
 * Six named beats, ordered low-to-high, split into two families:
 *
 *   depth (black, honest, no tint):   rest → rise → float
 *   glow  (gold, room "alive"):       whisper → bloom → radiance
 *
 * The site had 44+ raw `box-shadow` declarations in `globals.css` plus
 * inline drift in `press-phase.ts`, `clipboard-utils.ts`, `GemHome.tsx`,
 * `QuickMirrorCard.tsx`, and `SelectionPopoverTrigger.tsx`. This module
 * is the one home for shadow values; the adoption guard keeps it that way.
 *
 * IMPORTANT: if you change a value in globals.css, change it here too.
 * The test in __tests__/elevation-sync.test.ts catches drift.
 *
 * Credits: Mike K. (napkin — CSS-canonical + sync-test pattern, lifted from
 * motion.ts; the six-beat depth-vocabulary call after Elon's first-principles
 * teardown), Tanya D. (UX spec — the depth/glow split, the radius-coupling
 * table, the "shadow confirms what motion promised" rule, the layer-audit
 * deletions, hero-moment feel specs), Krystle C. (the original ledger shape
 * and adoption-guard sprint pattern), Jason F. (the `occlusion(beat, distance)`
 * one-call modifier — the actual deletion), Elon M. (the call to ship depth
 * beats with grafted occlusion and drop the rename), Paul K. (guard-first
 * ordering, adoption-guard-as-KPI discipline).
 */

// ─── Beat vocabulary — mirrors --sys-elev-* in app/globals.css ─────────────

/**
 * Six named beats, ordered low-to-high (rest → radiance).
 *
 * Naming is by *depth feel*, not by use-site. A popover USES `float`; a
 * thread USES `whisper`. Do NOT add beats like `popover-shadow` or
 * `thread-glow` — those are uses, not atoms.
 */
export const ELEVATION = {
  rest:     'none',                                                          // --sys-elev-rest
  rise:     '0 1px 2px 0 rgba(0,0,0,0.20)',                                  // --sys-elev-rise
  float:    '0 4px 14px 0 rgba(0,0,0,0.32)',                                 // --sys-elev-float
  whisper:  '0 0 12px 0 color-mix(in srgb, var(--gold) 12%, transparent)',   // --sys-elev-whisper
  bloom:    '0 0 18px 0 color-mix(in srgb, var(--gold) 22%, transparent)',   // --sys-elev-bloom
  radiance: '0 0 28px 0 color-mix(in srgb, var(--gold) 30%, transparent)',   // --sys-elev-radiance
} as const;

export type ElevationBeat = keyof typeof ELEVATION;

/** Ordered low → high. Used by the invariant + the adoption-guard error msg. */
export const ELEVATION_ORDER: readonly ElevationBeat[] =
  ['rest', 'rise', 'float', 'whisper', 'bloom', 'radiance'] as const;

/** "depth" — black-shadow family. Honest lift, no warmth. */
export const DEPTH_BEATS: readonly ElevationBeat[] =
  ['rest', 'rise', 'float'] as const;

/** "glow" — gold-tinted halo family. The room is alive. */
export const GLOW_BEATS: readonly ElevationBeat[] =
  ['whisper', 'bloom', 'radiance'] as const;

// ─── Helpers — pure, each ≤ 10 LOC ─────────────────────────────────────────

/** Raw shadow string for a named beat. Pure. */
export const shadowOf = (b: ElevationBeat): string => ELEVATION[b];

/** CSS custom-property reference for a named beat. Pure. */
export const cssVarOf = (b: ElevationBeat): string => `var(--sys-elev-${b})`;

/** True iff the beat is in the gold-glow family (whisper/bloom/radiance). */
export const isGlow = (b: ElevationBeat): boolean => GLOW_BEATS.includes(b);

/** True iff the beat is in the depth (black) family (rest/rise/float). */
export const isDepth = (b: ElevationBeat): boolean => DEPTH_BEATS.includes(b);

/** Clamp helper for distance / t parameters — kept tiny, used by occlusion. */
const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

// ─── Modulator — Jason's one-call "occlusion" graft ────────────────────────

/**
 * Jason's `occlusion(beat, distance)` graft, kept under that name by
 * Mike's call. Tanya credits the same idea as `depthModulated`. One math:
 *
 *   distance ∈ [0..1] dims the beat's apparent intensity. 0 = full beat,
 *   1 = full transparent. Use for ceremony falloff, behind-modal recession,
 *   thread-fade, "everything else dims while the keepsake reveals."
 *
 * The output is a `box-shadow` value mixed via `color-mix` at the CSS layer
 * — the browser does the work, we do not interpolate alpha in JS.
 */
export function occlusion(beat: ElevationBeat, distance: number): string {
  const d = clamp01(distance);
  if (d === 0) return cssVarOf(beat);
  const pct = Math.round((1 - d) * 100);
  return `color-mix(in srgb, ${cssVarOf(beat)} ${pct}%, transparent)`;
}

/**
 * Tanya's three-arg form, kept as a thin alias so the UX spec's vocabulary
 * survives in code. `t` (ceremony lifecycle) maps to the *complement* of
 * distance: subtle=0.33 → distance≈0.67. One implementation, two names.
 */
export function depthModulated(
  beat: ElevationBeat,
  distance: number,
  t: number,
): string {
  const dim = clamp01(distance) + (1 - clamp01(t));
  return occlusion(beat, clamp01(dim));
}

// ─── Invariants — a test can lock these down ───────────────────────────────

/**
 * Must hold: every beat in `ELEVATION_ORDER` is present in `ELEVATION`,
 * the two families partition the six beats with no overlap, and `rest`
 * is the only `'none'` beat. Pure.
 */
export function elevationInvariantHolds(): boolean {
  if (ELEVATION_ORDER.length !== Object.keys(ELEVATION).length) return false;
  if (DEPTH_BEATS.length + GLOW_BEATS.length !== ELEVATION_ORDER.length) return false;
  if (ELEVATION.rest !== 'none') return false;
  return ELEVATION_ORDER.every((b) => b in ELEVATION);
}

// ─── Allow-list token for the one honest exemption ─────────────────────────

/**
 * `lib/sharing/clipboard-utils.ts` ships HTML to a foreign clipboard where
 * `var(--sys-elev-*)` does not resolve — the shadow string must be inline.
 * The adoption scanner respects a single explicit token so the exemption is
 * documented, searchable, and review-flagged.
 *
 * Usage in source:
 *   // elevation-ledger:exempt — clipboard HTML, vars do not resolve
 *   const inline = '0 10px 15px -3px rgba(0,0,0,0.1)';
 */
export const ELEVATION_LEDGER_EXEMPT_TOKEN = 'elevation-ledger:exempt';
