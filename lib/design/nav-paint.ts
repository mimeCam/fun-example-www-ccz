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
