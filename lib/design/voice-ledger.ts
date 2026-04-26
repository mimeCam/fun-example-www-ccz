/**
 * Voice Ledger — Surface → AllowedVoice[] fence for the chip→keepsake journey.
 *
 * The room speaks in different voices on different surfaces *by design* (Tanya
 * UX §4, Elon §3.3): the chip paints worldview, the thread paints thermal,
 * the keepsake honors the reader in gold, the letter recognizes in accent.
 * Until now the *contract* lived in reviewer memory. This module promotes it
 * to a typed `Record<Surface, readonly Voice[]>` — every paint-bearing
 * surface in the journey names exactly which voices it is licensed to speak.
 *
 * One ledger up top, every surface bound to it, one audit at the bottom that
 * proves the binding (Mike napkin #54). Adding a `Surface` member without
 * populating its row is a TS error. Painting a token outside the surface's
 * license trips `chip-to-keepsake-audit.test.ts`. Drift becomes loud.
 *
 * Pattern: same shape as `WORLDVIEW_COLORS` (napkin #51) — a flat Record,
 * exhaustive over a closed string union. *Polymorphism is a killer.* The
 * ledger is data, not behavior; do not add `voiceByPosture()` accessors
 * (AGENTS.md §"posture suggests, posture does not dictate").
 *
 * Voice atoms — the *only* paint vocabulary every surface composes from:
 *
 *   worldview.{primary,cyan,rose,fog}  ← Explore chip background families
 *   voice.{accent,cyan,rose,mist}      ← chip text + neutral fallbacks
 *   thermal.accent                     ← --token-accent (violet→gold lerp)
 *   recognition.{accent,mist}          ← Letter / Whisper greeting voices
 *   archetype.{gold,halo}              ← Keepsake / Ceremony / Plate gold
 *
 * Each Voice maps to BOTH:
 *   • a Tailwind family literal (for className grep in the audit), AND
 *   • a CSS custom-property name (for inline-style / SVG attribute grep).
 *
 * Two address modes, one source of truth — same file every consumer imports.
 *
 * Credits: Mike K. (napkin #54 — Voice-Ledger sketch + 6-file budget +
 * `Record<Surface, readonly Voice[]>` typing call), Paul K. (#54 — "the room
 * speaks in one voice from chip to keepsake" outcome that this module
 * audits), Elon M. (#54 §3.3 — the empirical teardown that proved each
 * surface speaks its own voice; this ledger encodes that honestly), Tanya
 * D. (UX #58 §4, #10 §4.2 — the layout-invariant table that became this
 * module's data verbatim), Krystle C. / Jason F. (#66 / #71 — the
 * `philosophical → accent` realignment that lands as one row in
 * `worldview.ts` made auditable by this fence).
 */

// ─── Surfaces — the seven paint-bearing rooms in the journey ───────────────

/**
 * Closed union of every surface that paints a voice token in the chip→
 * keepsake chain. Adding a surface here without populating `VOICE_LEDGER`
 * trips a TS error (exhaustive Record). That is the fence.
 *
 * Ordered chronologically by the reader's journey (Tanya UX §5):
 *   chip      — Explore grid worldview tag (the door)
 *   thread    — Golden Thread vertical spine (the warming)
 *   ceremony  — completion choreography (the achievement)
 *   keepPlate — inline keepsake preview (the gift offered)
 *   keepsake  — full ThreadKeepsake SVG (the gift opened)
 *   letter    — ReturnLetter recognition (the welcome back)
 *   whisper   — RecognitionWhisper ambient (the half-remembered hello)
 */
export type Surface =
  | 'chip'
  | 'thread'
  | 'ceremony'
  | 'keepPlate'
  | 'keepsake'
  | 'letter'
  | 'whisper';

// ─── Voices — the only paint atoms the system admits ──────────────────────

/**
 * Closed union of paint atoms. Namespaced by *role* (the part of the
 * system that owns the voice), not by *family* (the Tailwind hue). A
 * voice is the contract; the family is the rendering. Two surfaces can
 * share a family (`accent`) while speaking different voices
 * (`thermal.accent` vs `recognition.accent`) — and the ledger keeps that
 * honest.
 */
export type Voice =
  | 'worldview.primary'    // chip bg — technical / philosophical
  | 'worldview.cyan'       // chip bg — practical
  | 'worldview.rose'       // chip bg — contrarian
  | 'worldview.fog'        // chip bg — undefined fallback
  | 'voice.accent'         // chip text — technical / philosophical
  | 'voice.cyan'           // chip text — practical
  | 'voice.rose'           // chip text — contrarian
  | 'voice.mist'           // chip text — fallback
  | 'thermal.accent'       // --token-accent (violet → gold thermal)
  | 'recognition.accent'   // ReturnLetter heading
  | 'recognition.mist'     // ReturnLetter sign-off, Whisper body
  | 'archetype.gold'       // KeepsakePlate, Ceremony, Whisper keyword
  | 'archetype.halo';      // ThreadKeepsake archetype-tinted orb

// ─── The ledger — exhaustive Record<Surface, readonly Voice[]> ─────────────

/**
 * Single typed home for the journey's voice contract. Every surface
 * names its complete licensed voice set; anything outside that set is
 * drift — caught by `chip-to-keepsake-audit.test.ts`.
 *
 * Declared `as const` so the readonly-array shape carries through into
 * call sites — consumers cannot accidentally mutate a row.
 */
export const VOICE_LEDGER: Record<Surface, readonly Voice[]> = {
  chip: [
    'worldview.primary', 'worldview.cyan', 'worldview.rose', 'worldview.fog',
    'voice.accent', 'voice.cyan', 'voice.rose', 'voice.mist',
  ],
  thread:    ['thermal.accent'],
  ceremony:  ['thermal.accent', 'archetype.gold'],
  keepPlate: ['archetype.gold'],
  keepsake:  ['thermal.accent', 'archetype.gold', 'archetype.halo', 'recognition.mist'],
  letter:    ['recognition.accent', 'recognition.mist'],
  whisper:   ['recognition.mist', 'archetype.gold'],
} as const;

// ─── Helpers — pure, each ≤ 10 LOC ─────────────────────────────────────────

/** Licensed voices for a surface. Pure. */
export function licenseFor(surface: Surface): readonly Voice[] {
  return VOICE_LEDGER[surface];
}

/** True if `voice` is licensed for `surface`. Pure. */
export function permits(surface: Surface, voice: Voice): boolean {
  return VOICE_LEDGER[surface].includes(voice);
}

// ─── Voice → Tailwind family (className-grep address mode) ────────────────

/**
 * Tailwind family literal each voice paints under
 * (`bg-<family>`, `text-<family>`, etc.). Used by the audit test to
 * grep rendered className strings — "is this surface's text-X among
 * its license's families?"
 *
 * `archetype.halo` has no flat Tailwind family — it routes through the
 * `--arch-{key}` CSS custom-property family. The audit treats `'arch'`
 * as a sentinel (matches `text-arch-*`, `bg-arch-*`).
 */
const TAILWIND_FAMILY_OF: Record<Voice, string> = {
  'worldview.primary':  'primary',
  'worldview.cyan':     'cyan',
  'worldview.rose':     'rose',
  'worldview.fog':      'fog',
  'voice.accent':       'accent',
  'voice.cyan':         'cyan',
  'voice.rose':         'rose',
  'voice.mist':         'mist',
  'thermal.accent':     'accent',
  'recognition.accent': 'accent',
  'recognition.mist':   'mist',
  'archetype.gold':     'gold',
  'archetype.halo':     'arch',
};

/** Tailwind family literal for a voice (e.g. `'accent'` for `voice.accent`). Pure. */
export const tailwindFamilyOf = (v: Voice): string => TAILWIND_FAMILY_OF[v];

/** Set of Tailwind families licensed for a surface. Pure, ≤ 10 LOC. */
export function familiesFor(surface: Surface): ReadonlySet<string> {
  return new Set(VOICE_LEDGER[surface].map(tailwindFamilyOf));
}

// ─── Voice → CSS custom property (inline-style / SVG-grep address mode) ──

/**
 * CSS custom-property each voice resolves to in canvas / SVG / inline-
 * style contexts. `thermal.accent` is the live thermal token; the others
 * point at brand statics defined in `app/globals.css`. `archetype.halo`
 * is the per-archetype family root — consumers index into it via
 * `--arch-${key}`.
 */
const CSS_VAR_OF: Record<Voice, string> = {
  'worldview.primary':  '--primary',
  'worldview.cyan':     '--cyan',
  'worldview.rose':     '--rose',
  'worldview.fog':      '--fog',
  'voice.accent':       '--accent',
  'voice.cyan':         '--cyan',
  'voice.rose':         '--rose',
  'voice.mist':         '--mist',
  'thermal.accent':     '--token-accent',
  'recognition.accent': '--accent',
  'recognition.mist':   '--mist',
  'archetype.gold':     '--gold',
  'archetype.halo':     '--arch',
};

/** CSS custom-property name for a voice (e.g. `'--token-accent'`). Pure. */
export const cssVarOf = (v: Voice): string => CSS_VAR_OF[v];

/**
 * `var(--…)` reference for a voice — convenience for SVG `fill` / inline
 * `style` attributes. Routes through `cssVarOf` so the address-mode lookup
 * stays single-source. Pure, ≤ 10 LOC.
 */
export const cssVarRefOf = (v: Voice): string => `var(${CSS_VAR_OF[v]})`;

// ─── Invariants — a test can lock these down ──────────────────────────────

/**
 * Must hold: every Surface row is non-empty (a surface that paints
 * nothing doesn't belong in the ledger). Every row's voices are
 * unique (no surface licenses the same voice twice). Pure.
 */
export function ledgerInvariantHolds(): boolean {
  return (Object.keys(VOICE_LEDGER) as Surface[]).every((s) => {
    const row = VOICE_LEDGER[s];
    if (row.length === 0) return false;
    return new Set(row).size === row.length;
  });
}

// ─── Contrast pairs — typed (fg, bg, floor) audit triples ─────────────────
//
// Promotes Krystle's worldview-chip contrast follow-on (AGENTS.md §"Follow-
// ons" #2; Tanya UX #10 §2.8) from prose to data, *next to the voices it
// constrains*. Mike napkin #95 §"Why this scope, not Paul's reframe":
// pairing data must live somewhere to feed `contrast(a, b)` (`lib/design/
// contrast.ts:31`); the smallest defensible home is here, ledger-adjacent,
// gated by `Surface`. Elon's salvaged kernel — store the triples, do not
// invent a phase enum, do not cross-ledger-accessor into `lib/thermal/`.
//
// `Partial<Record<Surface, …>>` reads honestly: today only `chip` carries
// audit pairs (rule of three — AGENTS.md §"Design System"). Other surfaces
// earn rows when a *second* concrete consumer shows up (keepsake legibility
// at thermal extremes, Golden Thread fill — separate PRs).
//
// Atomic fail-path is a property of the *data*, not the test: if any chip
// pair drops below its floor at either thermal anchor, the *family* alpha
// rung steps as one register — all four chips together — manual one-line
// edit in `lib/design/worldview.ts` (Tanya UX #62 §2: one register, four
// voices, never staggered). No per-chip override knob; that footgun was
// rejected at design time (Mike napkin #54 — "polymorphism is a killer").

/**
 * One audit triple — foreground voice over background voice with a WCAG
 * floor. The two voices are *symbolic*: the test resolves each to its
 * actual painted hex and composites the bg using `ALPHA.muted` (the
 * alpha rung the chip family sits on today; `lib/design/worldview.ts`).
 *
 * `floor`: 4.5 for normal text (WCAG 2.1 §1.4.3 AA). The 3:1 floor
 * (non-text / UI components) is correct WCAG and *will* matter for
 * keepsake gold orb + Golden Thread fill — but those are separate
 * surfaces, separate PRs. Mike napkin #95 §"Don't add a floor: 3 row
 * in this PR." Empirical scope discipline.
 */
export interface ContrastPair {
  readonly fg: Voice;
  readonly bg: Voice;
  readonly floor: number;
}

// ─── Named WCAG floors + the halo's intentional sub-WCAG ambient floor ────
//
// Floors are *numbers in the type system*, not prose in a docblock — so a
// future "harmonize the halo upward" PR fails on a typed `toBeLessThan`
// assertion (Elon §3.2 salvaged kernel; Mike napkin #99 §0 "lock-low"
// invariant; Tanya UX #85 §6 "the fence is encoded in the test, not in a
// taxonomy"). The genus is deferred until a *third* halo-class consumer
// lands under its own steam (rule of three; AGENTS.md §"Design System").

/**
 * WCAG 2.1 §1.4.3 contrast minimum for normal text — 4.5:1. Cited here so
 * the halo's `< WCAG_AA_TEXT` invariant is *number-vs-number*, not
 * comment-vs-comment. Pure constant.
 */
export const WCAG_AA_TEXT = 4.5;

/**
 * WCAG 2.1 §1.4.11 non-text contrast minimum for meaningful UI components
 * — 3.0:1. Cited so the halo's lock-low test can name the floor it sits
 * *below* (the halo is decorative ornament, not signal — Tanya UX #85 §1).
 * Pure constant.
 */
export const WCAG_NONTEXT = 3.0;

/**
 * Halo ambient contrast floor — **1.5:1, intentionally below WCAG 1.4.11**
 * (3:1 non-text). The halo is a *presence ornament*, not an information
 * surface: a halo that demands attention has already failed (Tanya UX #85
 * §1). The 1.5:1 floor is a UX promise — the room acknowledges the reader
 * *without* asking them to look at the glow itself. The reader-invariant
 * survives without the halo being perceptible: under
 * `prefers-reduced-transparency` and `prefers-contrast: more`, the halo
 * collapses to `none` (`ambient-surfaces.css` §"Gold halos") and the
 * gem/text/glyph carry the legibility load.
 *
 * If a future "harmonization" PR lifts this floor toward the WCAG 4.5:1
 * (text) or 3.0:1 (non-text) thresholds, the lock-low test in
 * `__tests__/halo-contrast-audit.test.ts` §0 fails *first*, before any
 * human review, and the failure points back at this JSDoc. That is the
 * fence — not a docblock noun, but a typed assertion (Mike napkin #99
 * §0; Elon §3.2 first-principles teardown).
 *
 * Pure constant.
 */
export const HALO_AMBIENT_FLOOR = 1.5;

/**
 * Thread ambient contrast floor — **1.5:1, intentionally below WCAG 1.4.11**
 * (3:1 non-text). Same lock-LOW doctrine as `HALO_AMBIENT_FLOOR`, applied
 * to the live `thermal.accent` voice the Golden Thread paints
 * (`--token-accent`, lerp violet → gold).
 *
 * **Why sub-WCAG, not signal-tier (3.0:1)** — the team's first plan
 * (Mike napkin #101) called for 3.0:1, by analogy to the keepsake-gold
 * gem (signal you look *at*). Empirical math (this implementation, ~2026-
 * 04-26) revealed the dormant cell is `contrast(#7b2cbf, #16213e) ≈ 2.24:1`
 * — below 3.0:1 in the existing canvas-safe palette (Tanya UX #35 §2.1
 * pins these endpoints). The 1.96:1 reality is already DOCUMENTED at
 * `__tests__/ambient-surfaces.test.ts:132` for the caret floor; the thread
 * audit honours that doctrine instead of forcing a palette mutation.
 *
 * **Conceptually, the thread at dormant is ambient-register, not signal-
 * register.** Tanya UX #35 §2.2: "perceived warmth lives in HSL, not in
 * WCAG — a 60° hue rotation crosses JND on a dark surface; luminance
 * contrast is the wrong instrument for the wrong measurement." The thread
 * at dormant is *the room beginning to know you're here* — a presence cue,
 * not a loud signal. As score climbs to 100, the warm cell reaches
 * `contrast(#f0c674, #1e2a3e) ≈ 8.95:1` — far above WCAG 1.4.3 (text,
 * 4.5:1). The thread *crosses* signal-tier on its own; the audit only
 * enforces the floor below which the cue is no longer perceptible.
 *
 * **One register, never staggered.** Tanya UX #62 §2 / #35 §2.3: a two-
 * floor split (cold/warm) was rejected at design time. One floor, two
 * cells, both clear it; the receipt prints BOTH ratios so the warming
 * spread is legible *as numbers* — Tanya's two-cell glyph (#35 §3.2) is
 * the killer-feature surface. Drift in either anchor surfaces in AGENTS.md
 * the moment the spread collapses.
 *
 * If a future "harmonize the thread to signal-tier" PR lifts this floor
 * toward 3.0:1 or higher, the lock-low test in
 * `__tests__/thread-contrast-audit.test.ts` §0 fails *first*, before any
 * human review, and the failure points back at this JSDoc. The fix path
 * (lifting `ACCENT.dormant` brighter, in `lib/thermal/thermal-tokens.ts`)
 * is a deliberate palette change, not a silent harmonization (Mike napkin
 * #99 §0 lock-low doctrine; Elon §3.2; Tanya UX #85 §6).
 *
 * Pure constant.
 */
export const THREAD_AMBIENT_FLOOR = 1.5;

/**
 * Audit pairs per surface. The chip row encodes the four named worldview
 * voices + the `fog`/`mist` fallback (Tanya UX #62 §4.5: "the audit table
 * should include the fallback pair, not just the four named voices, so
 * the fallback never becomes the *only* unreadable chip on the page").
 *
 * Five rows × two thermal anchors (`THERMAL.surface`, `THERMAL_WARM.
 * surface`) = ten assertions in `chip-contrast-audit.test.ts`. Still
 * trivial; covers "thermal extremes" without inventing a phase enum.
 *
 * NOTE: `technical` and `philosophical` paint identical (fg, bg) today
 * (`lib/design/worldview.ts` — both routed to `voice.accent` over
 * `worldview.primary`). The dedupe is honest, but the audit lists both
 * rows so a future split (philosophical → its own family — see AGENTS.
 * md taxonomy follow-on) cannot ship without re-running the floor.
 */
export const CONTRAST_PAIRS: Partial<Record<Surface, readonly ContrastPair[]>> = {
  chip: [
    { fg: 'voice.accent', bg: 'worldview.primary', floor: 4.5 }, // technical
    { fg: 'voice.accent', bg: 'worldview.primary', floor: 4.5 }, // philosophical
    { fg: 'voice.cyan',   bg: 'worldview.cyan',    floor: 4.5 }, // practical
    { fg: 'voice.rose',   bg: 'worldview.rose',    floor: 4.5 }, // contrarian
    { fg: 'voice.mist',   bg: 'worldview.fog',     floor: 4.5 }, // fallback
  ],
  // ─── Keepsake — two pairs on one surface, two distinct floors ────────
  //
  // Two floors on one surface: 1.5 ornament, 3.0 non-text signal. Same
  // gem, different fitness functions. No genus until a third floor lands.
  // (Elon §4.2 salvaged kernel; Mike napkin #100 §3.)
  //
  // The bg voice (`thermal.accent`) is *symbolic* — a stand-in for "the
  // live keepsake surface" that `keepsake` already licenses (see
  // VOICE_LEDGER above). The actual measurement resolves both canvas-safe
  // surface anchors (`THERMAL.surface`, `THERMAL_WARM.surface`) — same
  // two-anchor discipline as the chip audits (Mike napkin #95 §1).
  //
  // Pair 1 — `archetype.halo` over surface @ HALO_AMBIENT_FLOOR (1.5:1):
  //   Ornament you look *through*. Sub-WCAG by intent (see the constant's
  //   JSDoc). The halo audit expands across `Object.keys(ARCHETYPE)` (5
  //   voices × 2 anchors = 10 cells).
  //
  // Pair 2 — `archetype.gold` over surface @ WCAG_NONTEXT (3.0:1):
  //   Signal you look *at*. The gem off-platform render must clear WCAG
  //   1.4.11 against the live thermal surface at *both* anchors so a
  //   future "soften the gold for taste" PR fails on a number, not a
  //   taste argument. Gold is a single static hex (`BRAND.gold = #f0c674`),
  //   so the gold audit is 1 voice × 2 anchors = 2 cells (Mike napkin
  //   #100 §4.2 — symmetry of *shape*, not *cardinality*).
  keepsake: [
    { fg: 'archetype.halo', bg: 'thermal.accent', floor: HALO_AMBIENT_FLOOR },
    { fg: 'archetype.gold', bg: 'thermal.accent', floor: WCAG_NONTEXT      },
  ],
  // ─── Thread — one voice, two anchors, two ratios in one receipt ──────
  //
  // The fifth contrast-audit sibling. Same *floor* shape as the four
  // shipped audits (chip / archetype-chip / halo / keepsake-gold), one
  // floor, two anchor cells, atomic fail-path. The (fg, bg) is symbolic
  // — same shape as the keepsake row — `bg: 'thermal.accent'` stands in
  // for "the live thread surface" (`thread` already licenses
  // `thermal.accent` in VOICE_LEDGER above). Actual measurement resolves
  // both canvas-safe surface anchors (`THERMAL.surface`,
  // `THERMAL_WARM.surface`).
  //
  // The thread paints `--token-accent` directly (`color-mix` decoration
  // in `ambient-surfaces.css` collapses to opaque under `prefers-
  // contrast: more`); no compositeOver step (Mike napkin #101 §5 #3).
  // The fg hex at each anchor is the lerp endpoint:
  //   t = 0  →  ACCENT.dormant = '#7b2cbf'
  //   t = 1  →  ACCENT.warm    = '#f0c674'
  // Two cells today (1 voice × 2 anchors) — symmetry of *shape*, not
  // *cardinality* (Mike #100 §4.2 pinned trap). NO sweep, NO bridge
  // resolver, NO per-cell knob, NO `'envelope'` audit-shape tag, NO
  // `Δ_PERCEIVABLE` constant, NO cold/warm two-floor split (all rejected
  // at design time — Mike #101 §1; Tanya UX #35 §3.3).
  //
  // The §3 receipt prints BOTH cells side-by-side — the only departure
  // from the four shipped siblings, and the salvaged kernel from Elon
  // (#69 §4 / Tanya UX #35 §3.2). The dynamism becomes visible in
  // AGENTS.md *as numbers* without inventing a vocabulary for it. If a
  // future PR collapses the spread, the receipt makes it loud — that
  // would be the second envelope-shaped data point. Three of those, *then*
  // genus extraction (rule of three).
  thread: [
    { fg: 'thermal.accent', bg: 'thermal.accent', floor: THREAD_AMBIENT_FLOOR },
  ],
} as const;

/**
 * Audit pairs licensed for a surface. Pure, ≤ 10 LOC. Returns an empty
 * readonly array for surfaces without pairing data (rule-of-three: only
 * `chip` qualifies today). Callers iterate; no surface crashes the audit.
 */
export function contrastPairsFor(surface: Surface): readonly ContrastPair[] {
  return CONTRAST_PAIRS[surface] ?? [];
}
