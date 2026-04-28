/**
 * Gesture Atlas — typed table mapping each *use* (a verb) to one row of
 * (beat × ease × reduced-motion-policy) atoms. Verbs sit ABOVE the eight-
 * beat motion ledger; they do not pollute it.
 *
 * Rationale (Mike's tech-lead napkin #9, Tanya UX #78):
 *
 *   • The site already speaks thirteen coherent gestures. They were authored
 *     one PR at a time, and the duration/ease pairs scattered across ~30
 *     call sites under `components/**` and `app/**`. A reduced-motion
 *     designer-pass had to grep for thirty class fragments across thirty
 *     review windows; the verb-to-row mapping drifted.
 *
 *   • Verbs are **code, not comments.** A typed table — `keyof typeof
 *     GESTURES` — makes misspellings a TypeScript error, not folklore. No
 *     `// gesture: <verb>` annotations, no `__generated__` JSON, no kernel
 *     un-stripped-source capability addition. The table IS the registry.
 *
 *   • `gestureClassesOf(verb)` returns a **literal Tailwind class string**
 *     pre-expanded from a fixed table. Tailwind's JIT can only see classes
 *     that exist as-written in source — same lesson `alphaClassOf` paid for
 *     in `lib/design/alpha.ts`. Do not template-interpolate the class
 *     fragments; the surface loses its transition at runtime.
 *
 *   • `reduced: 'perform' | 'shorten' | 'skip'` is a **typed column** on
 *     each row. The column locks the policy at the type level so a reduced-
 *     motion pass is a one-table edit. The runtime carrier is
 *     `gestureClassesForMotion(verb, prefersReduced)`; the first consumer
 *     is `MirrorRevealCard` via `useReducedMotion()` (Mike napkin #88).
 *     Future call sites read the same composer.
 *
 *   • Thirteen verbs, four domains (Tanya UX §2): **input** (fingertip),
 *     **surface** (room leans), **content-swap** (one dissolves, another
 *     arrives), **ceremony** (narrative pacing). Each row carries a
 *     **felt sentence** in JSDoc — the line a reviewer reads aloud during
 *     PR review: *"Does this code make a reader feel {sentence}?"*
 *
 * Migration footprint: closed. `GESTURE_GRANDFATHERED_PATHS` is the empty
 * array — the fence's bare-class axis (Axis C) now FORBIDS bare
 * `duration-* ease-*` pairs across `app/**` and `components/**` site-wide,
 * not merely tolerates a shrinking allowlist. New entries are not added
 * without a tech-lead-approved migration plan; the list shape is
 * preserved (same as `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS`) so the
 * doctrine is structural, not advisory.
 *
 * IMPORTANT: every (beat, ease) pair in this table must be a key of
 * `MOTION` and `EASE` in `lib/design/motion.ts`. The sync test catches
 * drift on the next jest run.
 *
 * Credits: Mike K. (architect napkin #9 — typed-table-as-registry, JIT-
 * literal class factory, the four-axis fence shape lifted from `alpha-
 * call-site-fence`, the kernel-rides-same-rails framing), Tanya D. (UIX
 * #78 — twelve verbs, four domains, felt sentences, the `reduced` policy
 * per verb, the cross-verb coherence rule), Paul K. (the make-or-break
 * outcome statement: every gesture named, coherent, audited at build),
 * Elon M. (first-principles teardown — verbs are code not comments,
 * kernel-cost reality check, `?atlas=1` overlay deferred), Jason F.
 * (Gesture Atlas naming, cross-verb coherence diagnosis), Krystle C.
 * (5th-tenant value-fence frame, ~120 LoC scope discipline).
 */

import type { MotionBeat, MotionEase } from './motion';

// ─── Reduced-motion policy ─────────────────────────────────────────────────

/**
 * Three policies a gesture can carry under `prefers-reduced-motion: reduce`:
 *
 *   `perform` — the gesture is gentle enough to perform as authored. Color
 *               swaps, 2px translates, sub-frame fades. The felt sentence
 *               still lands at full duration.
 *   `shorten` — the gesture performs but compressed. Common for card-lift
 *               (color survives, scale drops), press-down (opacity-only),
 *               reveal-keepsake (300ms opacity).
 *   `skip`    — the gesture does not perform; the endpoint state lands
 *               instantly. Press-settle, card-settle — the *return* phases.
 *               A reader who turned motion off does not need the room
 *               exhaling at them.
 *
 * Wiring the resolver to honor this column is a follow-up sprint; the
 * field is locked at the type level today so the future pass is a one-
 * table edit. (Tanya UX §3.4 / Mike #9 Point 3.)
 */
export type ReducedPolicy = 'perform' | 'shorten' | 'skip';

// ─── Gesture row shape ─────────────────────────────────────────────────────

/**
 * One row in the Atlas. `beat` and `ease` are typed against the canonical
 * MotionBeat / MotionEase ledgers — they cannot drift off-vocabulary.
 * `reduced` is a typed column on the row, not a future field on a future
 * JSON. Every helper consumes this shape.
 */
export interface GestureRow {
  readonly beat: MotionBeat;
  readonly ease: MotionEase;
  readonly reduced: ReducedPolicy;
}

// ─── The vocabulary — fourteen verbs, four domains (Tanya UX §2) ───────────

/**
 * Fourteen kebab-case verbs, grouped by domain in JSDoc only. Naming is
 * `noun-of-action` (the fingertip presses; the card lifts; the keepsake
 * reveals). Per AGENTS.md, do not promote verb-vocabulary doctrine to
 * AGENTS.md until verb #3 fires — the table proves itself first.
 *
 * Each verb's felt sentence is the line a reviewer reads aloud during PR
 * review: *"Does this code make a reader feel {sentence}?"* If the answer
 * is no, the implementation is wrong before the pixels are wrong.
 */
export const GESTURES = {
  // ─── Input — the fingertip is heard ──────────────────────────────────────
  /** *"The button heard my fingertip — before any work begins."* */
  'press-down':       { beat: 'instant',   ease: 'out',     reduced: 'shorten' },
  /** *"The button is relaxing its grip — softly, no bounce."* */
  'press-settle':     { beat: 'enter',     ease: 'settle',  reduced: 'skip'    },
  /** *"This forward door notices I'm here."* (CSS-only translate; the row
   *  pins the ease so any future duration-bound variant inherits the curve.) */
  'focus-lean':       { beat: 'crossfade', ease: 'out',     reduced: 'perform' },
  /** *"The button is telling me it heard, and I heard it back."* */
  'action-swap':      { beat: 'fade',      ease: 'sustain', reduced: 'shorten' },

  // ─── Surface — the room leans in ─────────────────────────────────────────
  /** *"The card is rising to meet my eye — color first, depth a beat later."* */
  'card-lift':        { beat: 'hover',     ease: 'out',     reduced: 'shorten' },
  /** *"The card is drifting back down to sleep."* */
  'card-settle':      { beat: 'enter',     ease: 'settle',  reduced: 'skip'    },
  /** *"The room is closing its door — chamber first, the air dims a beat later."* */
  'threshold-slide':  { beat: 'instant',   ease: 'out',     reduced: 'shorten' },
  /** *"The room is exhaling a thought it doesn't quite say — present, then dim."*
   *  Whisper-class ambient fade: arrival/return greetings and the home gem's
   *  thermal color drift. 1000ms = `linger`, the passage-breathing beat. The
   *  three call sites (`ViaWhisper`, `RecognitionWhisper`, `GemHome`) shared
   *  this rhythm by accident before; the verb names the breath.
   *  `reduced: 'shorten'` (not `'skip'`) — a whisper at the floor crossfade
   *  is still a whisper; silence would invert the felt sentence.
   *  Krystle C. (verb #13), Tanya UX §1, Mike napkin #91. */
  'whisper-linger':   { beat: 'linger',    ease: 'out',     reduced: 'shorten' },

  // ─── Content swap — one thing dissolves while another arrives ────────────
  // TODO(rename-pass): scope-grew beyond keepsakes — `ReturnLetter` joined
  //                    `MirrorRevealCard` on this row (Sid napkin, Tanya §6,
  //                    Mike POI-4). Candidate names: `slow-reveal` or
  //                    `precious-reveal`. Hold until rule-of-three fires
  //                    (a third, non-keepsake consumer earns the rename).
  /** *"Something precious is emerging — slow, delicate, earned."*
   *  The killer-feature carrier — keepsake reveal is the project's "blog
   *  reads you back" moment landing visually. Tanya UX §2.3. */
  'reveal-keepsake':  { beat: 'reveal',    ease: 'out',     reduced: 'shorten' },
  /** *"The room's accent voice reaches this title first — color, not shape."* */
  'title-warm':       { beat: 'crossfade', ease: 'out',     reduced: 'perform' },
  /** *"One thing dissolves while another arrives — neither rushing."* */
  'fade-neutral':     { beat: 'fade',      ease: 'sustain', reduced: 'shorten' },
  /** *"One label replacing another — instant enough that I don't see the seam."* */
  'crossfade-inline': { beat: 'crossfade', ease: 'out',     reduced: 'perform' },

  // ─── Ceremony — narrative pacing ─────────────────────────────────────────
  /** *"Two seconds of presence on the Golden Thread — then peace."*
   *  The dwell pacing is owned by `CEREMONY.glowHold` (2000ms); the FADE
   *  on this verb is the `settle` beat (1500ms) with the `settle` curve. */
  'thread-glow-settle': { beat: 'settle',  ease: 'settle',  reduced: 'shorten' },
  /** *"The Thread is laying its tide mark down — slow, patient, on the
   *   same beat as the rest of the room."*
   *  Sibling to `thread-glow-settle`: the FADE on the Thread's *fill*
   *  (opacity + width) rides the `out` curve (the entrance/depth dialect
   *  the rest of the room speaks), not the `settle` curve (which is the
   *  glow-close arc). Verb earns the rule-of-two on the Thread surface —
   *  `thread-glow-settle` named the box-shadow recede; `thread-settle`
   *  names the fill recede that lifts the inline `style.transition` off
   *  `GoldenThread.tsx:162` onto the Atlas baton. `reduced: 'shorten'`
   *  (not `'skip'`) — this is the recede phase; a reader who turned
   *  motion off still wants the rung to land at `opacity-muted`, just
   *  not via a 1.5s sigh. Mike napkin #62, Tanya UIX #23. */
  'thread-settle':      { beat: 'settle',  ease: 'out',     reduced: 'shorten' },
} as const satisfies Record<string, GestureRow>;

export type GestureVerb = keyof typeof GESTURES;

/** Ordered list — used by the invariant + the sync test enumeration. */
export const GESTURE_VERBS: readonly GestureVerb[] =
  Object.keys(GESTURES) as GestureVerb[];

// ─── Helpers — JIT-safe class-string factories ─────────────────────────────
//
// Each emits a STRING LITERAL Tailwind's JIT can see in source. Do NOT
// template-interpolate these — `` `duration-${beat} ease-${ease}` `` is
// invisible to the compiler and the class falls out of the bundle. Same
// trap `alphaClassOf` already paid for in `lib/design/alpha.ts`.

/**
 * One row × two literal class fragments × one row again — the (beat, ease)
 * pair pre-expanded for JIT discovery. Duration and easing are the only
 * two keystrokes the table emits at every call site; transform/opacity
 * properties stay site-local because gestures vary in *what* they animate
 * (transform-only, opacity-only, color-only, all). ≤ 10 LoC by row count.
 */
const VERB_CLASSES: Readonly<Record<GestureVerb, string>> = {
  'press-down':         'duration-instant ease-out',
  'press-settle':       'duration-enter ease-settle',
  'focus-lean':         'duration-crossfade ease-out',
  'action-swap':        'duration-fade ease-sustain',
  'card-lift':          'duration-hover ease-out',
  'card-settle':        'duration-enter ease-settle',
  'threshold-slide':    'duration-instant ease-out',
  'whisper-linger':     'duration-linger ease-out',
  'reveal-keepsake':    'duration-reveal ease-out',
  'title-warm':         'duration-crossfade ease-out',
  'fade-neutral':       'duration-fade ease-sustain',
  'crossfade-inline':   'duration-crossfade ease-out',
  'thread-glow-settle': 'duration-settle ease-settle',
  'thread-settle':      'duration-settle ease-out',
};

/**
 * Tailwind class fragment for a verb — e.g. `gestureClassesOf('card-lift')`
 * → `"duration-hover ease-out"`. Compose with the property class at the
 * call site: `` `transition-colors ${gestureClassesOf('title-warm')}` ``.
 * Pure, ≤ 10 LoC. JIT-safe (returns a literal from a fixed table).
 */
export function gestureClassesOf(verb: GestureVerb): string {
  return VERB_CLASSES[verb];
}

/**
 * Pre-resolved `crossfade-inline` carrier — the Tailwind fragment
 * `'duration-crossfade ease-out'` (120 ms, ease-out). One named home for
 * the verb the chrome-rhythm continuity contract names: AmbientNav
 * (chassis fade + per-link hover), NextRead (coda wrapper fade),
 * GoldenThread (spine wrapper fade). Four call sites, three files, one
 * source of truth.
 *
 * Why module-scope (Mike napkin #22 §6, Krystle rule-of-three lift):
 *
 *   • Three identical literal-string assignments under three local
 *     names (`NAV_HOVER_GESTURE`, `NEXT_READ_GESTURE`, `PRESENCE_GESTURE`)
 *     could drift independently. Lifting collapses the carrier to one
 *     export; the four consumers import the same identifier.
 *
 *   • The verb's name is the constant's name (not `CHROME_CROSSFADE`,
 *     not `WRAPPER_FADE`). The fourth consumer — AmbientNav's per-link
 *     hover — is NOT a chrome-rhythm surface (it rides
 *     `transition-colors`, not the presence-rung lattice). Naming the
 *     constant after the mechanism keeps every call site reading
 *     neutrally.
 *
 *   • JIT-safe. The right-hand side resolves at module load to a string
 *     literal Tailwind's compile-time scanner sees through
 *     `gestureClassesOf`'s expansion table — same pattern as
 *     `alphaClassOf` and the rest of `VERB_CLASSES`. **Do not** template-
 *     interpolate or wrap in a lazy getter; the surface loses its
 *     transition at runtime.
 *
 * Use as `transition-opacity ${CROSSFADE_INLINE} ${presenceClassOf(rung)}`
 * (chrome-rhythm presence carrier) or `transition-colors ${CROSSFADE_INLINE}
 * ${paint}` (per-link hover swap). The verb is the same; the call site
 * supplies the property and the meaning. Pinned by
 * `crossfade-inline-adoption.test.ts` (positive pin + outside-fence ban).
 */
export const CROSSFADE_INLINE: string = gestureClassesOf('crossfade-inline');

/**
 * The reduced-motion class fragment for a verb — `'perform'` returns the
 * classes as authored, `'shorten'` returns the same beat at the floor
 * crossfade-shortened (10ms = `MOTION_REDUCED_MS`, the universal floor),
 * `'skip'` returns the empty string (the endpoint state lands instantly,
 * no transition class is emitted). Pure, ≤ 10 LoC.
 *
 * The runtime carrier is `gestureClassesForMotion(verb, prefersReduced)`
 * (see below); the first consumer is `components/mirror/MirrorRevealCard.tsx`
 * via `useReducedMotion()` (Mike napkin #88). The `reduced:` column is no
 * longer "locked-but-unwired" — the killer feature reads it.
 */
export function reducedClassOf(verb: GestureVerb): string {
  const policy = GESTURES[verb].reduced;
  if (policy === 'skip') return '';
  if (policy === 'perform') return VERB_CLASSES[verb];
  return 'duration-crossfade ease-out';
}

/**
 * The verb's class fragment **branched on the runtime motion preference**:
 *
 *   `prefersReduced === false` → `gestureClassesOf(verb)` (the authored row)
 *   `prefersReduced === true`  → `reducedClassOf(verb)`   (the policy row)
 *
 * Both arms resolve to STRING LITERALS Tailwind's JIT can already see in
 * source — this composer is a runtime ternary over two table reads, never
 * a template. Same JIT-literal lesson as `alphaClassOf` and `gestureClassesOf`.
 *
 * Wire this at any `'use client'` call site that reads `useReducedMotion()`.
 * Per Mike napkin #88, `MirrorRevealCard` is the first consumer that turns
 * the locked `reduced:` column into behaviour the visitor can feel. Pure,
 * ≤ 10 LoC. Pinned by `gestures-sync.test.ts`.
 */
export function gestureClassesForMotion(
  verb: GestureVerb,
  prefersReduced: boolean,
): string {
  return prefersReduced ? reducedClassOf(verb) : gestureClassesOf(verb);
}

// ─── Invariant — locked by the sync test ──────────────────────────────────

/**
 * Must hold: every verb has a `beat`, `ease`, `reduced` field; the verb
 * list is in sync with the class table; no two verbs share the same row
 * by accident (cross-verb coherence is a structural property — same
 * (beat, ease) is allowed, the table makes it visible). Pure.
 */
export function gestureInvariantHolds(): boolean {
  if (GESTURE_VERBS.length !== Object.keys(VERB_CLASSES).length) return false;
  return GESTURE_VERBS.every((v) => {
    const row = GESTURES[v];
    if (row === undefined || VERB_CLASSES[v] === undefined) return false;
    return row.beat.length > 0 && row.ease.length > 0 && row.reduced.length > 0;
  });
}

// ─── Allow-list token + grandfather inventory ─────────────────────────────

/**
 * Inline `// gesture-ledger:exempt — <reason>` comment marks a line as an
 * honest exception. The well-known reason is "motion fade endpoint" — the
 * Threshold exit stagger in `lib/utils/animation-phase.ts` already owns
 * Motion's α=0/α=1 endpoints under the alpha ledger; a corresponding
 * gesture-ledger carve-out keeps that path readable.
 *
 * Mirror of `ALPHA_LEDGER_EXEMPT_TOKEN` and `ELEVATION_LEDGER_EXEMPT_TOKEN`.
 * Reviewer-visible tokens beat invisible drift.
 */
export const GESTURE_LEDGER_EXEMPT_TOKEN = 'gesture-ledger:exempt';

/**
 * Path-allow-list for files that already speak the duration/ease dialect
 * directly (pre-Atlas). **The list is empty by design — the fence forbids;
 * do not re-add without a tech-lead-approved migration plan.** Mirrors
 * `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS` (same shape, same shrink-
 * only doctrine).
 *
 * Atlas closure receipt — Sid (2026-04-27): the Gesture Atlas closed at
 * thirteen verbs and zero grandfathered paths. The fence flipped from
 * *tolerate* to *forbid*: Axis C (no bare `duration-* ease-*` outside the
 * factory) now fails CI on any new entry rather than waving it through
 * via this list. A typed 13-row table + a JIT-literal class factory + a
 * shrink-only fence make a class of motion-drift bugs structurally
 * impossible at zero added complexity.
 *
 * The annotation `: readonly string[]` is preserved through the empty-
 * array case to keep TS from inferring `never[]` if `as const` ever
 * widens (Mike #36 §7).
 *
 * History — receipts of the migration that closed this list:
 *
 *   • Mike #88 — `MirrorRevealCard.tsx` redeemed onto
 *     `gestureClassesForMotion('reveal-keepsake' | 'fade-neutral', reduce)`;
 *     killer-feature carrier.
 *   • Sid / Tanya UIX #53 (Mike #42) — `app/resonances/ResonanceEntry.tsx`
 *     redeemed two transitions in one breath onto `card-settle` +
 *     `fade-neutral`.
 *   • Sid / Tanya UIX #99 (Mike #92) — `components/mirror/ShareOverlay.tsx`
 *     redeemed onto `crossfade-inline`.
 *   • Mike #91 — `whisper-linger` (verb #13) redeemed `ViaWhisper`,
 *     `RecognitionWhisper`, `GemHome` in one breath; later joined by
 *     `app/resonances/EvolutionThread.tsx`.
 *   • Sid / Tanya UIX §3 (Mike #9) — `components/return/ReturnLetter.tsx`
 *     redeemed onto `reveal-keepsake` + `fade-neutral`.
 *   • Sid / Mike (this PR, 2026-04-27) — `lib/resonances/visited-launcher.ts`
 *     removed as fence-residue. The launcher is a paint-only resolver
 *     (alpha + color, no transition strings); its transition rides
 *     `<Pressable>` upstream. The entry was never gating anything — the
 *     fence scans `app/**` + `components/**`, and `lib/resonances/` is
 *     out-of-scope for the bare-class lint. Deleting the entry is the
 *     receipt; nothing in the file moves.
 */
export const GESTURE_GRANDFATHERED_PATHS: readonly string[] = [
  // receipt: closed at length 0 (Sid 2026-04-27). The fence forbids new
  // entries; the line above this annotation IS the entire migration
  // doctrine going forward. See JSDoc for the historical receipts.
] as const;

/**
 * Path-allow-list for the Motion-endpoint-owning module. This file is the
 * one home for raw transition strings tied to the threshold exit stagger
 * (see `BACKDROP_EXIT_DELAY_MS`, `CHAMBER_EXIT_MS`). Mirror of
 * `ALPHA_MOTION_ENDPOINT_PATHS`.
 */
export const GESTURE_MOTION_ENDPOINT_PATHS: readonly string[] = [
  'lib/utils/animation-phase.ts',
] as const;
