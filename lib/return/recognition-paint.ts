/**
 * Recognition Paint — call-site policy that maps a recognition phase to
 * its alpha-rung Tailwind class. Sibling to `recognition-timeline.ts`
 * (timing) and `recognition-surface.ts` (spatial selector).
 *
 * Three modules under `lib/return/`, one per concern: timing, spatial,
 * paint. The folder is *the* register; we don't need the word "register"
 * in any filename to make that legible. (Mike napkin §"Co-locate by
 * sibling, not by domain split".)
 *
 * Until this module landed, two whisper surfaces (`RecognitionWhisper`,
 * `ViaWhisper`) hand-mapped phase → opacity each in their own way. Two
 * of three rungs disagreed (`ViaWhisper` painted `opacity-100` where
 * `RecognitionWhisper` painted `opacity-quiet`; `ViaWhisper` did not
 * honour `phase === 'rest'` at all). This module gives them one address
 * so the "one breath, one voice" claim stops being a docblock and
 * starts being a unit test.
 *
 * The mapping (Tanya UIX spec §2.1 — adjudicated, end of debate):
 *
 *   `rest`            → opacity-0       (the breath; nothing visible)
 *   `lift` / `settle` → opacity-quiet   (the cue speaks at gold/70)
 *   `hold` / `fold`   → opacity-muted   (the dim after the dwell)
 *
 * `quiet` (0.70) is the rung calibrated as *"content, but not THE
 * content — the closing of a letter."* Painting the wrapper at
 * `opacity-100` would stack element opacity on top of the alpha-ledger's
 * color alpha — double attenuation, and the whisper would compete with
 * the article body. The wrapper steps back; the gold body color speaks.
 *
 * Pure, stateless, SSR-safe. No React, no `window`, no `setTimeout`. The
 * fade between rungs is the existing `whisper-linger` gesture verb
 * (resolved at the call site via `gestureClassesOf`); this module is
 * only the destination, not the journey.
 *
 * Imports `RecognitionPhase` from `recognition-timeline.ts` and nothing
 * else. If the implementing engineer feels the urge to import Tailwind
 * plugins, React, hooks, `alphaClassOf`, or any token module — stop.
 * The whole job is the closed-union switch below. (Mike napkin §"Mirror
 * the kernel's import discipline".)
 *
 * Credits:
 *   • Krystle Suarez (VP of Product, report #44) — the original lift of
 *     `phaseOpacityClass` into a named helper. The salvageable atom is
 *     hers; this module gives the helper the address it earned and one
 *     more caller.
 *   • Tanya Donska (UIX spec #79 §2.1) — the verdict that `quiet` is the
 *     speaking rung on both surfaces. End of debate.
 *   • Mike Koch (architect, napkin #115) — the rule-of-three discipline
 *     that keeps this module a single function (no typed `Record<phase,
 *     paint-dim>` with `null` rows until a real third caller appears).
 *   • Elon Musk (First-Principles, report #99) — the 5-line convergence
 *     teardown that named the cost of a typed register today.
 *   • Paul Kim (Strategist, report #26) — the make-or-break framing
 *     ("one breath, one voice across whisper surfaces") that this
 *     module makes structurally true.
 *   • The unnamed authors of `recognition-timeline.ts`, `motion.ts`,
 *     `alpha.ts` — every shape here is a composition of those modules.
 */

import type { RecognitionPhase } from '@/lib/return/recognition-timeline';

// ─── The mapping — alpha-ledger:exempt block (Motion fade endpoints) ───────
//
// `opacity-0` is the Motion fade-out endpoint owned by Tanya's spec §10
// (acceptance step #1: "Silence for 1500ms. The page is fully painted;
// the whisper line is not."). `opacity-quiet` and `opacity-muted` are
// proper alpha-ledger rungs. The block-level exempt token below covers
// the `opacity-0` literal under the same convention used at every other
// motion-endpoint site (see `lib/design/__tests__/alpha-adoption.test.ts`
// §"line-is-exempt — block-level comment").
//
// alpha-ledger:exempt — motion fade endpoint

/**
 * Map a recognition phase to its alpha-rung Tailwind class. Pure.
 *
 * Closed-union switch — adding a `RecognitionPhase` member without a
 * case here is a TypeScript error (`assertNever` narrows to `never`).
 * Same idiom as `recognition-timeline.ts:planFor` / `easeFor`.
 */
export function phaseOpacityClass(phase: RecognitionPhase): string {
  if (phase === 'rest') return 'opacity-0';
  if (phase === 'lift' || phase === 'settle') return 'opacity-quiet';
  if (phase === 'hold' || phase === 'fold') return 'opacity-muted';
  return assertNever(phase);
}

/** Compile-time exhaustiveness witness — fires only on union extension. */
function assertNever(x: never): never {
  throw new Error(`Unhandled RecognitionPhase: ${String(x)}`);
}
