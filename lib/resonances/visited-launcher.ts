/**
 * visited-launcher — pure paint resolver for `<QuoteCardLauncher>`.
 *
 * One pure function, one boolean in, one Tailwind class string out.
 * Mirrors the shape of `link-phase.ts` resolvers — no React, no DOM, no
 * state. Snapshot-tested + WCAG-audited in `__tests__/`.
 *
 *   resolveLauncherPaint(false)  →  "text-mist/70"        (rest, stranger)
 *   resolveLauncherPaint(true)   →  "text-gold/70"        (rest, witness)
 *
 * The launcher already lives at the rest rung the page wears today
 * (mist/70). When the same-card keepsake has been *Saved* this session,
 * the launcher repaints in a warmer family at the same rung. Family
 * resemblance, not a new colour.
 *
 * ─── Why `quiet` (alpha 0.70), not `recede` (alpha 0.50) ───
 *
 * Tanya UX #98 §2 named `gold/50` (recede) as the design's first pick
 * (semantic match: "the frame around the subject"). Both Tanya §2 and
 * Mike #31 §7 PoI #5 stipulated the contingency: **the contrast audit
 * must pass, not just the snapshot. If `gold/50` fails the WCAG 4.5:1
 * floor, step the rung UP to `quiet` (0.70), not down. Defend the alpha
 * ledger; never paint louder than the contrast budget allows.**
 *
 * Empirical reading (see `visited-launcher.contrast.test.ts`):
 *   gold/50 over alive card surface (cold) ≈ 3.53:1   ← fails 4.5:1
 *   gold/50 over alive card surface (warm) ≈ 3.39:1   ← fails 4.5:1
 *   gold/70 over alive card surface (cold) ≈ 5.65:1   ← passes
 *   gold/70 over alive card surface (warm) ≈ 5.18:1   ← passes
 *
 * The `recede` rung crashed the floor at both anchors. The doctrine
 * promised to step up to `quiet` in that case — so the resolver paints
 * the visited rest at `quiet` (gold/70). Recognition still lands (a
 * warmer family is the cue, not a louder rung), and AA holds at both
 * thermal endpoints. One degree of freedom, one decision.
 *
 * ─── Persistence ───
 *
 * None. The boolean this resolver consumes is owned by `useState<Set<
 * string>>` on `<ResonancesClient>`. Closing the tab clears the Set.
 * Refresh forgets. **This is the contract** (Tanya §6, Mike §7.6, Paul
 * §4 + Elon §3.5: pragmatic, not principled). If a future PR wants
 * cross-session memory, that is a different feature with its own
 * privacy audit — not a knob on this resolver.
 *
 * ─── Scope fence (do not weaken without a second caller) ───
 *
 *   • One caller today (`<QuoteCardLauncher>`).
 *   • One degree of freedom (the alpha rung).
 *   • Zero new design tokens. Zero new motion durations. Zero new
 *     components. The transition rides the launcher's existing
 *     `transition-all duration-fade` and the global reduced-motion
 *     floor in `<Pressable>`.
 *
 * Credits:
 *   • Tanya D. (UIX #98 §2 — the rung table, the family-resemblance
 *     promise, the recognition test, the §3 motion non-event).
 *   • Mike K. (Architect #31 §3 — the resolver shape, §4 the load-
 *     bearing wiring correction, §7 PoI #5 the contrast-audit obligation,
 *     §10 the explicit fence list).
 *   • Elon M. (corrections via Mike #31: signal-not-bus, no-ninth-ledger,
 *     the contrast audit must pass not just snapshot, session-only as
 *     pragmatic-not-principled).
 *   • Paul K. (the experience contract Tanya wrote against — the launcher
 *     is the only artifact verb on the resonance card).
 *   • Sid (this lift, 2026-04-26 — the audit-driven rung step from
 *     recede→quiet, the resolver as one pure function, the test pair).
 */

import { alphaClassOf, type AlphaRung } from '@/lib/design/alpha';

// ─── Public surface — one boolean in, one class string out ───────────────

/**
 * Rung the visited paint sits on. `quiet` (0.70) by audit decision (see
 * file header). Exported for the test file's invariant + the contrast
 * audit's alpha lookup. Not a parameter — there is no second knob.
 */
export const VISITED_RUNG: AlphaRung = 'quiet';

/**
 * Rung the rest paint sits on. `quiet` (0.70) — same rung as the visited
 * paint, by intent. Recognition is carried by the colour family (mist →
 * gold), not the rung. Family resemblance, no rung jump.
 */
export const REST_RUNG: AlphaRung = 'quiet';

/**
 * Tailwind class for the launcher's text colour, given the visited
 * boolean. Pure; ≤ 5 LOC. Returns a string literal Tailwind's JIT can
 * see (because `alphaClassOf` returns a literal — no template
 * interpolation).
 */
export function resolveLauncherPaint(visited: boolean): string {
  if (visited) return alphaClassOf('gold', VISITED_RUNG, 'text');
  return alphaClassOf('mist', REST_RUNG, 'text');
}

// ─── Invariants — a test can lock these down ─────────────────────────────

/**
 * Must hold: the two paint cells are on the ledger, they share a rung
 * (family resemblance, not a rung jump), the rung is `recede` or
 * `quiet` (loud-enough to be glanceable, never `hairline`/`muted`).
 * Pure, ≤ 10 LOC.
 */
export function visitedLauncherInvariantHolds(): boolean {
  if (VISITED_RUNG !== REST_RUNG) return false;
  if (VISITED_RUNG !== 'recede' && VISITED_RUNG !== 'quiet') return false;
  const rest    = resolveLauncherPaint(false);
  const visited = resolveLauncherPaint(true);
  if (rest === visited) return false;
  return rest.startsWith('text-mist/') && visited.startsWith('text-gold/');
}
