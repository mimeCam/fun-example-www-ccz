/**
 * chrome-paint — single resolver for the chrome-muted hairline.
 *
 * Five chrome edges, one paint can, one fence. The hairline that frames
 * the room's chrome surfaces — top edge of `AmbientNav`, bottom-corner
 * `Toast` pill, the two `Keepsake` share-card frames, the `Threshold`
 * overlay, the inline `KeepsakePlate` thumbnail — all route through
 * `chromeMutedBorder()` and resolve to the same on-ledger literal:
 * `alphaClassOf('fog','muted','border')` (= `border-fog/30`).
 *
 * Why a kernel — and why this particular kernel
 * ---------------------------------------------
 * Mike napkin §1: "Five chrome edges, one paint can, one fence." Five
 * sites means a kernel earns its keep (rule of three+two). Drift had
 * already crept in (raw `border-fog/30` in `Threshold.tsx` and
 * `KeepsakePlate.tsx` outside the resolver call) — the lift closes a
 * real drift hole, not a theoretical one. Tanya §2 names what the
 * kernel is *defending*: "the room has a single hand drawing its
 * frames" — a coincidence that becomes a property when the call site
 * is the same byte every time.
 *
 * What this module is — and what it deliberately is not
 * ----------------------------------------------------
 *   • A pure delegating resolver. No new alpha math; no new colors;
 *     no new posture; no parameters. The function call IS the name.
 *     (Mike PoI #6: "Polymorphism is a killer." The moment this takes
 *     a `rung` argument, it stops being the kernel — `alphaClassOf`
 *     already exists for that.)
 *   • The README the next contributor reads first (Tanya §7 #2).
 *     30-second teach: which five surfaces share, where the fence
 *     lives, the explicit "join or fork" rule for any sixth caller.
 *   • NOT a Voice-Ledger entry. The ledger is data, not behavior;
 *     a constant border that *agrees* across surfaces is the
 *     opposite of a voice (voices vary by surface). Mike PoI #7;
 *     napkin #54 doctrine.
 *   • NOT a doctrine-naming surface. No "Perimeter Voice" string in
 *     this file, in test names, in source comments. Naming the
 *     discipline to the reader breaks the spell (Paul, Tanya §6).
 *
 * The five sites (this list is the SSOT for the fence)
 * ----------------------------------------------------
 *   1. `components/shared/Toast.tsx`           — bottom-corner pill border.
 *   2. `lib/design/nav-paint.ts`               — `AmbientNav` chassis hairline.
 *   3. `components/articles/QuoteKeepsake.tsx` — quote-card preview frame.
 *   4. `components/reading/ThreadKeepsake.tsx` — thread-card preview frame.
 *   5. `components/shared/Threshold.tsx`       — center-variant overlay edge.
 *   6. `components/reading/KeepsakePlate.tsx`  — inline thumbnail frame.
 *
 * Six call sites, one register. Sites #5 and #6 graduated from raw
 * literals during this lift; the prior four already routed through
 * `alphaClassOf` and were lifted to the kernel for byte-identical
 * grep parity.
 *
 * Adding a sixth surface (the join-or-fork rule)
 * ----------------------------------------------
 * If your PR introduces a new chrome edge, your first stop is here.
 *   • JOIN — call `chromeMutedBorder()`, add the path to `SITES`
 *     (below), let the fence pin the new surface.
 *   • FORK — declare a new family. The kernel does not move; the
 *     ledger does not gain a "voice" for an exception. Document the
 *     fork in the calling component's docstring + a focused per-file
 *     test.
 *
 * Honest exemption: an inline `// chrome-paint:exempt — <reason>`
 * comment on a raw `border-fog/30` literal in a migrated site is the
 * audit trail when (rare) the call cannot route through this kernel.
 * The fence's drift sweep tolerates lines bearing the token.
 *
 * Credits: Mike K. (napkin §1–§6 — kernel-lift scope, the join-or-
 * fork doctrine, "polymorphism is a killer," fence-as-the-moat),
 * Tanya D. (UX §2–§3 — five-edges-one-hand felt sentence, the
 * `/30` load-bearing calibration, the no-parameters discipline that
 * keeps the kernel a name), Krystle C. (the rule-of-three timing
 * and the 5th-caller observation that licensed the lift), Paul K.
 * (focus discipline — "do not let this PR gain weight it cannot
 * carry"), Elon M. (taxonomy teardown — ship the engineering, no
 * new ledger seat), Sid (this lift; pure delegation, ≤ 10 LOC each).
 */

import { alphaClassOf } from './alpha';

// ─── The kernel — one paint can ────────────────────────────────────────────

/**
 * Chrome-muted hairline class. Resolves to the on-ledger literal
 * `alphaClassOf('fog','muted','border')` (= `border-fog/30`).
 *
 * Pure delegation. No arguments — by design (Mike PoI #6). The
 * function call IS the vocabulary; the JIT-visible literal it returns
 * is the wire format. Sub-microsecond at runtime; one V8 inline cache
 * line.
 *
 * Use it as the *whole* `border-<color>/<rung>` token; compose with
 * the `border` keyword from the host:
 *
 *     <div className={`border ${chromeMutedBorder()} rounded-...`} />
 *
 * Pure, ≤ 10 LOC.
 */
export function chromeMutedBorder(): string {
  return alphaClassOf('fog', 'muted', 'border');
}

// ─── The fence's SSOT — sites + factory-call literal ───────────────────────

/**
 * The six chrome surfaces that route through `chromeMutedBorder()`.
 * Order matches the felt journey through the room:
 *   ceiling → bookend → quoted artifact → kept artifact → doorway →
 *   inline plate.
 *
 * The fence at `__tests__/chrome-paint-fence.test.ts` reads this list
 * (via `__testing__.SITES`) and grep-pins each file to the factory
 * call. If a future PR migrates a sixth surface to `chromeMutedBorder()`,
 * append the path here ONCE — the fence picks it up automatically.
 */
const SITES: readonly string[] = [
  'lib/design/nav-paint.ts',
  'components/shared/Toast.tsx',
  'components/articles/QuoteKeepsake.tsx',
  'components/reading/ThreadKeepsake.tsx',
  'components/shared/Threshold.tsx',
  'components/reading/KeepsakePlate.tsx',
] as const;

/**
 * The exact call expression every migrated site must contain. Locked
 * verbatim — the fence's `toContain` assertion fails the first PR that
 * spells the call differently (e.g. with a stray space, alias, or
 * parameter). Mike PoI #2: do not invent the test pattern; this mirrors
 * `gestures-call-site-rhythm.test.ts:FACTORY_CALL`.
 */
const FACTORY_CALL = 'chromeMutedBorder()' as const;

/**
 * Honest-exemption token for the rare line that cannot route through
 * this kernel (e.g. a forced-colors carve-out, a structural ad-hoc).
 * Inline form on the same line as the literal:
 *
 *     'border border-fog/30' // chrome-paint:exempt — <reason>
 *
 * The fence's drift-sweep tolerates lines bearing this token. Same
 * shape as `alpha-ledger:exempt` in the wider ledger.
 */
const EXEMPT_TOKEN = 'chrome-paint:exempt' as const;

// ─── Test surface — fence consumes via `__testing__` (no public re-export) ─

/**
 * Internal handles the per-site fence reads. Surfaced via `__testing__`
 * (not the module's public face) so consumers cannot accidentally take
 * a dependency on the SSOT shape — only the fence does. Mirrors the
 * `__testing__` pattern already in use across `Toast`, `QuoteKeepsake`,
 * and `ThreadKeepsake` for per-file alpha pins.
 */
export const __testing__ = { SITES, FACTORY_CALL, EXEMPT_TOKEN } as const;
