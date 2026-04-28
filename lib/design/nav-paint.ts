/**
 * nav-paint — pure resolver from (state, quiet, route) → className string.
 *
 * The single home for navigation chrome's Tailwind paint dialect. Every
 * literal `text-{mist,gold,rose}/<n>` in the navigation surfaces lives
 * HERE, behind a typed function call. The components do the React work
 * (hooks, links, refs); this file owns the paint.
 *
 * Why this module exists
 * ----------------------
 * Mike napkin #90 §0 — graduate `GemHome`, `AmbientNav`, `NavPulseDot`
 * off raw Tailwind literals onto the Voice Ledger so the audit fence can
 * grep one file instead of three. Tanya UX #42 §1 — snap the gem's four
 * states to ledger rungs (`hairline`, `muted`, `recede`, `quiet`) so the
 * Golden Thread is the *only* surface that speaks loud gold. Both reports
 * converge on this artifact.
 *
 * Design rules honoured
 * ---------------------
 *   • Stateless. No hooks. No React imports. Components pass thermal
 *     state in. Per AGENTS.md "begin any implementation with a simple
 *     stateless function." (Mike napkin #90 §5 #3.)
 *   • JIT-safe — every class string is emitted by `alphaClassOf`, which
 *     pulls a literal from a flat lookup table. NO template-built class
 *     names; the audit fence depends on direct string outputs.
 *     (Mike napkin #90 §5 #5.)
 *   • Polymorphism is a killer. No subclasses, no posture accessors;
 *     the lookups are flat `Record`s, the resolvers are switch + table.
 *   • One source of truth. The four gem rungs and the five nav voices
 *     are pinned by the ledger row; if a future PR drops a voice from
 *     `VOICE_LEDGER['gem' | 'nav']`, the audit catches it.
 *
 * Credits: Mike K. (napkin #90 — the resolver shape, the audit-fence-as-
 * deliverable framing, the "polymorphism is a killer" reminder, and the
 * three-files-no-inheritance budget); Tanya D. (UX #42 §1 — the four-row
 * felt-sentence table that became the gem rung map verbatim, plus the
 * pair-rule justification for stepping the gold rungs back so the Thread
 * remains the loud register); Paul K. (#100 — "polish the carrier so the
 * modulation is heard", the business outcome both refactors serve);
 * Elon M. (#53 §3 — the global → chrome → page ordering, plain-English).
 */

import { alphaClassOf, type AlphaRung } from './alpha';
import { chromeMutedBorder } from './chrome-paint';
import type { ThermalState } from '@/lib/thermal/thermal-score';

// ─── Gem — quiet/dormant + three thermal rungs ────────────────────────────

/**
 * Per-state ledger rung for the gem icon. Tanya UX #42 §1:
 *
 *   quiet / dormant  → hairline (0.10) — "it's geometry; the eye registers
 *                                         it as space, not surface."
 *   stirring         → muted    (0.30) — "something is here, but skim past."
 *   warm             → recede   (0.50) — "the frame around the subject."
 *   luminous         → quiet    (0.70) — "content, but not THE content."
 *
 * The gold rungs step BACK from the file's pre-graduation values
 * (mist/20 → mist/10, gold/60 → gold/50, gold/80 → gold/70) — pair-rule
 * sister surfaces (Mike #92): when two gold surfaces share a frame, the
 * carrier picks the lower rung; the Golden Thread is the loud register.
 *
 * Pure data. No re-export — `gemPaint` is the only consumer.
 */
const GEM_RUNG_BY_STATE: Record<ThermalState, AlphaRung> = {
  dormant:  'hairline',
  stirring: 'muted',
  warm:     'recede',
  luminous: 'quiet',
};

/**
 * Gem icon className — paints exactly one Tailwind text-color literal.
 * Pure, ≤ 10 LOC.
 *
 * @param state — current thermal state (`useThermal().state`).
 * @param quiet — collapse to dormant rung regardless of state (article pages).
 * @returns `text-mist/10` | `text-mist/10` | `text-gold/30` | `text-gold/50`
 *          | `text-gold/70` — verbatim, JIT-visible.
 */
export function gemPaint(state: ThermalState, quiet: boolean): string {
  if (quiet) return alphaClassOf('mist', 'hairline', 'text');
  const rung = GEM_RUNG_BY_STATE[state];
  if (rung === 'hairline') return alphaClassOf('mist', rung, 'text');
  return alphaClassOf('gold', rung, 'text');
}

/**
 * Luminous-only halo — gold-tinted, low-alpha, follows the SVG silhouette
 * via filter. Tanya UX #42 §2 explicitly preserves the existing beat:
 * "one halo, one state, one beat. Do not add halos to warm or stirring."
 * Pure, ≤ 10 LOC.
 *
 * @returns `'drop-shadow-sys-whisper'` at luminous, empty otherwise.
 */
export function gemShadow(state: ThermalState, quiet: boolean): string {
  if (quiet) return '';
  return state === 'luminous' ? 'drop-shadow-sys-whisper' : '';
}

// ─── Nav items — inactive + per-route hover ───────────────────────────────

/**
 * AmbientNav route → hover voice family. Four routes, four hovers, one
 * lookup. The Threshold + Mirror destinations both warm to gold; the
 * Articles destination softens to mist; the Book destination tilts to
 * rose. (AmbientNav.NAV_ITEMS pre-graduation, conserved by intent.)
 *
 * Module-scope literals so the Tailwind JIT and the audit fence both see
 * the strings without indirection. Mike napkin #90 §5 #5: greppability is
 * non-negotiable.
 */
const NAV_HOVER_BY_HREF: Record<string, string> = {
  '/':            'hover:text-gold',
  '/articles':    'hover:text-mist',
  '/mirror':      'hover:text-gold',
  '/resonances':  'hover:text-rose',
};

/**
 * Inactive baseline — `mist/recede` (text-mist/50). One rung above the
 * gem's quiet/dormant `hairline` so the bottom nav reads as *present
 * chrome the reader can find* without competing with the prose. Module-
 * scope so `alphaClassOf` resolves once at import time.
 */
const NAV_INACTIVE = alphaClassOf('mist', 'recede', 'text');

/**
 * Nav-item className for an inactive (non-current-route) link. Pure,
 * ≤ 10 LOC. Returns the inactive baseline plus the route's hover voice.
 *
 * @param href — destination path; one of `/`, `/articles`, `/mirror`,
 *               `/resonances`. Unknown routes fall back to the gold hover
 *               (the threshold register) so the function is total.
 * @returns `'text-mist/50 hover:text-{gold|mist|rose}'`.
 */
export function navItemPaint(href: string): string {
  const hover = NAV_HOVER_BY_HREF[href] ?? 'hover:text-gold';
  return `${NAV_INACTIVE} ${hover}`;
}

/**
 * Active-item className — routes through the global `.nav-active-link`
 * CSS class which paints `color: var(--token-accent)`. The voice ledger
 * licenses `thermal.accent` for the `nav` surface; that is what this
 * class resolves to. Pure, ≤ 10 LOC.
 */
export function navItemActivePaint(): string {
  return 'nav-active-link';
}

// ─── Bottom-bar chassis — geometry + frosted scrim + on-ledger hairline ───

/**
 * Bottom navigation bar chassis className — a duet, not a chorus solo.
 *
 * The chassis is two-natured (Mike napkin #110 §4a, Tanya UIX #43 §2):
 *
 *   1. The HAIRLINE is voice. `border-fog/<rung>` is a Tailwind
 *      shorthand on the alpha ledger; it routes through `alphaClassOf`
 *      and snaps to `muted` (= 0.30) — one register up from the gem's
 *      `hairline` (= 0.10), exactly where Tanya UIX #43 §1 calibrates
 *      the felt-sentence "a faint line marks where the bar begins."
 *      This is the third pair-snap of `border-fog/20 → /30` after
 *      `ThreadKeepsake` (bdb7608) and `QuoteKeepsake` (3f25b18); the
 *      rule-of-three threshold (Mike #110 §6) licenses the snap but
 *      NOT a kernel-lift — two callers are not a kernel.
 *
 *   2. The SCRIM is structural — `bg-void/80 backdrop-blur-sm` is the
 *      frosted-glass carrier that lets content under the bar read as
 *      visible-but-hushed. `void` ∉ `ALPHA_COLOR_FAMILIES` and `/80`
 *      ∉ legal alpha rungs `{10,30,50,70,100}`; routing this through
 *      `alphaClassOf` would either lie about the scrim (Tanya §2.2 (a))
 *      or dilute the four-rung discipline (option (c)). The honest
 *      mechanism is the inline `// alpha-ledger:exempt — <reason>`
 *      token (Elon teardown §3 recommendation (a), Tanya §2.2 pick).
 *
 * Pure, ≤ 10 LOC. Returns one className string composed of geometry,
 * animation + scrim, and the on-ledger hairline. The `bg-void/80`
 * literal lives HERE so the literal and its exempt token grep together;
 * `AmbientNav.tsx` then contains zero `bg-void/<N>` and zero
 * `border-fog/<N>` matches (fence § §1, widened in this PR).
 *
 * Credits: Mike K. (napkin #110 — sprint shape, the duet framing,
 * pair-snap-no-kernel-lift heuristic, the LOC budget); Tanya D. (UIX
 * #43 — felt-sentence calibration, the option-(a) honest-exempt pick,
 * the layer/sibling check, the "stillness is part of the felt-sentence"
 * micro-detail); Elon M. (#80 — first-principles falsification that
 * `bg-void/80` cannot honestly route through `alphaClassOf`, and the
 * inline-exempt recommendation adopted verbatim).
 */
export function navBarChassis(): string {
  // alpha-ledger:exempt — `bg-void/80` is a structural scrim (frosted-
  // glass carrier doing layout work), NOT a voice register. `void` is
  // not in ALPHA_COLOR_FAMILIES; `/80` is not a legal rung. The hairline
  // below IS voice (fog/muted) and routes through alphaClassOf.
  //
  // The chrome-rhythm sprint (Tanya UIX #46 §2.D2) lifted the prior
  // `animate-fade-in` keyframe off this chassis: AmbientNav now stays
  // mounted on hidden routes and cross-fades via `opacity-{0,100}` +
  // `transition-opacity` instead of mount/unmount. Keeping `animate-
  // fade-in` here would clash with the opacity gate on first paint
  // (the keyframe would flash the bar in for 200ms before the class
  // settled at `opacity-0`). The `crossfade-inline` verb (120ms,
  // ease-out) lives at the consumer call site — the chassis owns
  // geometry + scrim + hairline ONLY.
  const geom = 'fixed bottom-0 inset-x-0 z-sys-nav';
  const scrim = 'bg-void/80 backdrop-blur-sm';
  // chrome-paint kernel — the chassis hairline shares one register with
  // Toast / Threshold / KeepsakePlate / both Keepsakes (Mike napkin §1).
  const hairline = `border-t ${chromeMutedBorder()}`;
  return `${geom} ${scrim} ${hairline}`;
}
