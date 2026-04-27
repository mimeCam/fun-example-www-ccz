/**
 * Gesture Atlas — typed table mapping each *use* (a verb) to one row of
 * (beat × ease × reduced-motion-policy) atoms. Verbs sit ABOVE the eight-
 * beat motion ledger; they do not pollute it.
 *
 * Rationale (Mike's tech-lead napkin #9, Tanya UX #78):
 *
 *   • The site already speaks twelve coherent gestures. They were authored
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
 *   • Twelve verbs, four domains (Tanya UX §2): **input** (fingertip),
 *     **surface** (room leans), **content-swap** (one dissolves, another
 *     arrives), **ceremony** (narrative pacing). Each row carries a
 *     **felt sentence** in JSDoc — the line a reviewer reads aloud during
 *     PR review: *"Does this code make a reader feel {sentence}?"*
 *
 * Migration footprint: ~30 existing call sites currently spell
 * `transition-X duration-Y ease-Z` directly. Migrating them onto
 * `gestureClassesOf('verb')` is a multi-PR effort; in this sprint we land
 * the table + the call-site fence + a small starter migration. The
 * remaining call-site files live in `GESTURE_GRANDFATHERED_PATHS`, where
 * the fence's bare-class axis tolerates them while still enforcing axes A,
 * B, and D site-wide. Each entry on the grandfather list is a future
 * micro-PR receipt; the list should ONLY shrink. (Same shape as
 * `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS` in `lib/design/alpha.ts`.)
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

// ─── The vocabulary — twelve verbs, four domains (Tanya UX §2) ─────────────

/**
 * Twelve kebab-case verbs, grouped by domain in JSDoc only. Naming is
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
 * directly (pre-Atlas). Each entry is a migration receipt waiting to be
 * redeemed: a future micro-PR replaces the bare classes with
 * `gestureClassesOf('verb')` and removes the path from this list. The
 * list should ONLY shrink. (Same shape as
 * `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS`.)
 *
 * Why grandfathering rather than a one-PR migration: ~30 sites across 12
 * files. A single-PR migration is high-risk for a polish sprint; an
 * incremental migration with the fence in place ensures *new* call sites
 * land on the verb registry while existing ones get redeemed file by file.
 *
 * When migrating a file off this list:
 *   (a) replace `transition-X duration-Y ease-Z` with
 *       `transition-X ${gestureClassesOf('verb')}`, OR
 *   (b) wrap the class composition in a verb-named helper that calls
 *       `gestureClassesOf` once and is referenced everywhere downstream.
 */
export const GESTURE_GRANDFATHERED_PATHS: readonly string[] = [
  'app/resonances/ResonanceEntry.tsx',
  // Mike napkin #88 — `MirrorRevealCard.tsx` redeemed: now reads
  // `gestureClassesForMotion('reveal-keepsake' | 'fade-neutral', reduce)`
  // and honors `prefers-reduced-motion` via `useReducedMotion()`. The list
  // ONLY shrinks; do not re-add without a new migration receipt.
  // Sid napkin #N (Tanya UX spec, "One Mirror, One Room") — the
  // `components/mirror/QuickMirrorCard.tsx` entry is gone because the
  // file is gone. The orphan was never rendered: `app/mirror/page.tsx`
  // adapts a quick-mirror result into `MirrorRevealCard` for both
  // branches; the article page removed the inline reveal long ago.
  // Retiring the file is the cleanest possible noun-shaped answer to
  // "what word did I retire today?" — one fewer surface, one fewer
  // dialect, one shorter ledger. The list ONLY shrinks.
  'components/mirror/ShareOverlay.tsx',
  // Mike napkin #91 — `whisper-linger` (verb #13) redeemed three sites in
  // one breath: `ViaWhisper`, `RecognitionWhisper`, `GemHome`. They all
  // shared the (linger, out) rhythm longhand; the verb names it. The
  // call-site rhythm fence pins them to the same string forever.
  // Mike napkin #N (Tanya UX §3) — `app/resonances/EvolutionThread.tsx`
  // redeemed onto `whisper-linger`; the fourth site joins ViaWhisper /
  // RecognitionWhisper / GemHome on the (linger, out) breath. The page's
  // gold thread of memory now runs through chapter break + carrying divider
  // + this whisper as one chord. The list ONLY shrinks.
  'components/return/ReturnLetter.tsx',
  'lib/resonances/visited-launcher.ts',
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
