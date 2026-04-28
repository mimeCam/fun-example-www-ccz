/**
 * Presence Helper — chrome-rhythm continuity contract, one home, three callers.
 *
 * Three sibling chrome surfaces (`AmbientNav`, `NextRead`, `GoldenThread`)
 * share ONE invariant: appearance ⊕ disappearance MUST ride opacity, never
 * `return null`. The "graceful arrival, graceful departure" rule that
 * Tanya UIX #46 §2.D2 named the *chrome-rhythm continuity contract* —
 * lifted here from three local literals into one typed home.
 *
 * Three members:
 *
 *   `gone`      — surface is mounted but invisible. `opacity-0`,
 *                 `pointer-events-none`. ARIA-hidden. The first paint of
 *                 a never-engaged reader sees this state.
 *   `attentive` — surface is visible and active. `opacity-100`. The
 *                 reader is *with* the surface; the surface is with the
 *                 reader. Default-presence chrome rung.
 *   `gifted`    — surface is visible at the ceremony beat. `opacity-100`.
 *                 Identical at the wrapper level to `attentive`; the
 *                 ceremony register lives in component-local fill paint
 *                 (e.g. `golden-thread-settled`, `archetype` chip glow).
 *                 Naming the rung at the wrapper level means a reviewer
 *                 reading the call site (`presenceClassOf('gifted')`) sees
 *                 *what UX role this beat plays*, not just *which opacity*.
 *
 * `latent` is **not** in the ledger this sprint. It earns its keep when
 * its consumer ships (the cross-session-return binding — `__rt=1`).
 * Rule of three / rule of zero — Mike napkin #18 §2.4, Elon §3.2.
 *
 * Fence safety:
 *   • This file is path-allow-listed in `ALPHA_MOTION_ENDPOINT_PATHS` so
 *     its `opacity-0` / `opacity-100` literals are licensed without
 *     per-line exempt tokens.
 *   • Helpers return STRING LITERALS from a fixed table. Tailwind's JIT
 *     can only see classes that exist as-written in source — same
 *     lesson `alphaClassOf` and `gestureClassesOf` paid for. Do not
 *     replace with template interpolation.
 *
 * Reduced-motion:
 *   The presence fragment is the endpoint pair (alpha, alpha+pen-events).
 *   The TRANSITION carrier (`crossfade-inline`, 120ms ease-out) is
 *   composed at the call site via `gestureClassesOf` so each chrome
 *   surface owns its own motion seam — same shape AmbientNav and
 *   NextRead already use.
 *
 * Credits: Mike K. (architect napkin #18 — three-member helper, JIT-safe
 * literal table, ALPHA_MOTION_ENDPOINT_PATHS add, fence-test pattern lifted
 * from `alpha-adoption`/`elevation-adoption`), Tanya D. (UIX #44 §1, §4 —
 * the four-rung visual spec; the wrapper-level slice this helper owns
 * sits *below* the fill rungs, and the contract that AmbientNav/NextRead
 * already adopted is what this lifts), Elon M. (rule-of-zero veto on
 * `latent`-without-consumer; the speculative-abstraction trim), Krystle C.
 * (rule-of-three doctrine — three callers, three states, one home),
 * Jason F. (the `presence.ts` filename and the verb-named rungs),
 * Paul K. (the "felt, not announced" load-bearing sentence the contract
 * exists to keep).
 */

// ─── Vocabulary ────────────────────────────────────────────────────────────

/**
 * Three felt rungs of chrome presence at the wrapper level. Ordered by
 * presence intensity (gone < attentive < gifted). The order matters only
 * for documentation; the helpers index by name, not position.
 */
export type Presence = 'gone' | 'attentive' | 'gifted';

/** Ordered list — used by the invariant + future fence enumeration. */
export const PRESENCE_ORDER: readonly Presence[] =
  ['gone', 'attentive', 'gifted'] as const;

// ─── Class-string lookup — JIT-safe literals ──────────────────────────────
//
// Each cell is a STRING LITERAL Tailwind's JIT can see in source. The path
// `lib/design/presence.ts` is path-allow-listed under
// `ALPHA_MOTION_ENDPOINT_PATHS` in `lib/design/alpha.ts`, so the
// `opacity-0` / `opacity-100` motion endpoints below are licensed without
// per-line exempt tokens (Mike #18 §2.2). Other files reaching for the
// `opacity-0 pointer-events-none` substring are caught by the
// `presence-adoption` fence test.

/**
 * Wrapper-level class fragment for a presence rung. Composed at the call
 * site with `transition-opacity` + `gestureClassesOf('crossfade-inline')`
 * (or the verb the surface already rides) so the cross-fade endpoint pair
 * gates a 120 ms graceful arrival/departure.
 */
const PRESENCE_CLASSES: Readonly<Record<Presence, string>> = {
  gone:      'opacity-0 pointer-events-none',
  attentive: 'opacity-100',
  gifted:    'opacity-100',
};

/**
 * Class fragment for a presence rung. Pure, ≤ 10 LOC. JIT-safe (returns a
 * literal from a fixed table). Compose with `transition-opacity` and the
 * crossfade-inline gesture verb at the call site:
 *
 *   `${navBarChassis()} transition-opacity ${gestureClassesOf('crossfade-inline')} ${presenceClassOf(p)}`
 */
export function presenceClassOf(p: Presence): string {
  return PRESENCE_CLASSES[p];
}

// ─── ARIA-hidden lookup — pure, type-narrowed return ──────────────────────

/**
 * `aria-hidden` value for a presence rung. `gone` → `'true'`; visible
 * rungs → `undefined` (omits the attribute, the React idiom for "let
 * assistive tech see this surface"). Pure, ≤ 10 LOC.
 *
 * The narrowed return type keeps callers from accidentally rendering
 * `aria-hidden="false"` (which is a different semantic — *forces* AT to
 * see the element even inside a hidden ancestor). Mirrors the precedent
 * AmbientNav and NextRead already established at their call sites.
 */
export function presenceAriaHidden(p: Presence): 'true' | undefined {
  return p === 'gone' ? 'true' : undefined;
}

// ─── Invariant — locked by the sync portion of the fence test ─────────────

/**
 * Must hold: every rung in `PRESENCE_ORDER` is in `PRESENCE_CLASSES`,
 * the `gone` rung carries `pointer-events-none` (the "don't eat clicks
 * while invisible" pledge), and the visible rungs do NOT (the surface
 * is interactive when present). Pure, ≤ 10 LOC.
 */
export function presenceInvariantHolds(): boolean {
  if (PRESENCE_ORDER.length !== Object.keys(PRESENCE_CLASSES).length) return false;
  if (!PRESENCE_ORDER.every((r) => r in PRESENCE_CLASSES)) return false;
  if (!PRESENCE_CLASSES.gone.includes('pointer-events-none')) return false;
  return PRESENCE_ORDER
    .filter((r) => r !== 'gone')
    .every((r) => !PRESENCE_CLASSES[r].includes('pointer-events-none'));
}
