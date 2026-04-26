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
