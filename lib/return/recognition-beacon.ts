/**
 * Recognition Beacon — paint-zero archetype primer.
 *
 * Sibling to `recognition-surface.ts` (spatial), `recognition-timeline.ts`
 * (temporal), `recognition-paint.ts` (alpha-rung), `recognition-tempo.ts`
 * (thermal modulation). The fifth sibling owns *paint-zero*: the < 5 ms
 * slot before first contentful paint where `<html>` learns the reader's
 * **archetype** and **recognition tier** so the room can be warm before
 * the whisper speaks.
 *
 * The whisper still lifts at +1500 ms (`recognition-timeline.ts` is
 * sacred — see Mike napkin §6 POI 3). What changes here is what is
 * *already true* by the time React hydrates: the Golden Thread's pre-lit
 * alpha, the accent-bias degrees on the existing hue ring, the data-attrs
 * the new CSS selectors in `app/globals.css` consume.
 *
 * Cross-page transitions are governed by `crossfade-inline` (120 ms
 * ease-out), not by the no-motion rule. The "no entrance animation"
 * rule applies only at cold paint zero — when a reader navigates within
 * the same session and the tier flips, the wrapper transitions through
 * the existing chrome-rhythm baton. (Mike napkin #35 §6 POI 7.)
 *
 * Budget. The IIFE rides `INLINE_RESTORE_SCRIPT` on the LCP critical
 * path; today's emission is < 1 KB (the fence test pins the cap at
 * 2 KB). A measured-p95 throttled-mobile profile lands in a follow-up
 * sprint; until then the cap is the line in the sand. // TODO: write
 * the measured p95/p99 budget for `beaconScriptFragment()` into this
 * header once a throttled-Moto-G profile is captured (Mike #35 §6 POI 6).
 *
 * Pure, stateless, SSR-safe. No React, no `window`, no `document`. The
 * inline IIFE fragment emitted by `beaconScriptFragment()` is the *only*
 * piece of this module that touches the browser — it is a STRING the
 * build-time codegen splices into `INLINE_RESTORE_SCRIPT` (see
 * `scripts/generate-inline-restore.ts`). Single source of truth.
 *
 * Stranger ≡ today. When no localStorage signals are present, the script
 * writes `data-recognition-tier="stranger"` and the CSS rules for that
 * tier are byte-identical to today's `:root` (no `--thread-alpha-pre`,
 * no `--accent-bias`). The fence test pins this invariant.
 *
 * Credits:
 *   • Mike Koch (architect, `_reports/from-michael-koch-project-architect-100.md`)
 *     — the napkin diagram (§3), the module shape (§4), the stranger ≡
 *     today invariant (§6 POI 2), the rule-of-three discipline that earns
 *     this fifth sibling (§4 preamble), the LoC budget (§4 table).
 *   • Tanya Donska (UIX, `_reports/from-tanya-donska-expert-uix-designer-56.md`)
 *     — §4.1 Golden Thread pre-warm rationale (one-rung lerp; never two);
 *     §4.2 hearth-glow on the page foot is an inner shadow, not a gradient;
 *     §6 "no new color, no new animation, no new copy" — fully honored.
 *   • The unnamed engineers behind `lib/thermal/inline-restore.ts`,
 *     `lib/return/recognition-{surface,timeline,paint,tempo}.ts`,
 *     `lib/design/{alpha,hue}.ts`, `lib/hooks/useReturnRecognition.ts` —
 *     every shape here composes those modules.
 */

import type { ArchetypeKey } from '@/types/content';
import type { AlphaRung } from '@/lib/design/alpha';

// ─── Recognition tier — closed union, mirrors useReturnRecognition ────────

/**
 * The three states the reader can be in. SAME UNION as
 * `useReturnRecognition`'s `RecognitionTier` — duplicated here only so
 * this module stays a pure leaf (no React imports). The fence test pins
 * the two unions as equal.
 */
export type RecognitionTier = 'stranger' | 'returning' | 'known';

/** All tiers, enumerated. Test-friendly; do not hand-edit. */
export const RECOGNITION_TIERS: readonly RecognitionTier[] = [
  'stranger', 'returning', 'known',
] as const;

// ─── localStorage keys — single address, no string drift ──────────────────

/**
 * The three localStorage keys this module reads. Single address so the
 * fence test can prove the inline script + the React hook + this module
 * all read from the same names. (Mike napkin §3 diagram.)
 */
export const BEACON_KEYS = {
  archetype:  'quick-mirror-result',
  snapshots:  'mirror_snapshots',
  memory:     'reading_memory',
} as const;

// ─── Pure: derive tier from the three signals ─────────────────────────────

/**
 * Pure derivation, byte-identical to `useReturnRecognition`'s `resolveTier`.
 * Lives here so the inline script can compute it without importing React.
 *
 * stranger  — no archetype, no visit history.
 * returning — visited ≥ 2 times (count of `reading_memory` keys).
 * known     — has archetype AND has snapshots.
 *
 * Pure, ≤ 10 LOC. The fence test cross-checks against the hook's resolver.
 */
export function deriveTier(
  archetype: ArchetypeKey | null,
  visitCount: number,
  hasSnapshots: boolean,
): RecognitionTier {
  if (!archetype && visitCount === 0) return 'stranger';
  if (archetype && hasSnapshots) return 'known';
  if (visitCount >= 2) return 'returning';
  return 'stranger';
}

// ─── Pure: archetype → accent-bias degrees (additive hue tilt) ────────────

/**
 * Five archetypes; each tilts the accent hue ring by a small bias.
 * These degrees are NOT new colours — they are added to the existing
 * thermal-interpolated `--token-accent`'s hue at the CSS layer, never
 * overriding it. The biases are calibrated on the same wheel that
 * `lib/design/hue.ts` walks (one wheel, one source of truth).
 *
 * Per Tanya §4.1: the pre-warm is "one rung", never two. The bias is the
 * archetype's whisper to the room — a returning explorer's accent is
 * still gold, just leaning a few degrees toward warm orange.
 *
 * The mapping (from Mike napkin §4 / Tanya UX §4.1):
 *   deep-diver  → 280° (cool violet — depth)
 *   explorer    →  38° (warm orange — outward)
 *   faithful    →  12° (rose-amber  — settled)
 *   resonator   → 320° (rose-magenta — kinship)
 *   collector   → 200° (cyan-blue   — order)
 *
 * Pure, exhaustive switch. Adding a sixth `ArchetypeKey` flips this
 * file red on the same PR (closed-union exhaustiveness witness).
 */
export function archetypeAccentBias(a: ArchetypeKey): number {
  if (a === 'deep-diver') return 280;
  if (a === 'explorer')   return 38;
  if (a === 'faithful')   return 12;
  if (a === 'resonator')  return 320;
  if (a === 'collector')  return 200;
  return assertNeverArch(a);
}

// ─── Pure: tier → Golden Thread alpha rung ────────────────────────────────

/**
 * The pre-lit Golden Thread alpha rung, per recognition tier.
 *
 *   stranger  → 'hairline' (sentinel — CSS treats this as `none`; the
 *               thread stays at today's behaviour, bytes unchanged.
 *               Stranger ≡ today, Mike §6 POI 2.)
 *   returning → 'muted'    — "the room knows you came back."
 *   known     → 'recede'   — "the room remembers your archetype."
 *
 * One rung step per tier — Tanya §4.1 "two rungs is too loud." Composes
 * from existing `AlphaRung` ledger entries; no new rungs. Pure, ≤ 10 LOC.
 */
export function threadAlphaForTier(t: RecognitionTier): AlphaRung {
  if (t === 'stranger')  return 'hairline';
  if (t === 'returning') return 'muted';
  if (t === 'known')     return 'recede';
  return assertNeverTier(t);
}

// ─── Compile-time exhaustiveness witnesses ───────────────────────────────

function assertNeverArch(x: never): never {
  throw new Error(`Unhandled ArchetypeKey: ${String(x)}`);
}

function assertNeverTier(x: never): never {
  throw new Error(`Unhandled RecognitionTier: ${String(x)}`);
}

// ─── Inline-script fragment — the build-time stringly bit ─────────────────

/**
 * The IIFE source fragment that the build-time codegen splices into
 * `INLINE_RESTORE_SCRIPT`. Returns a STRING; pure (deterministic), no
 * I/O. Re-runs of the codegen with no input change MUST produce
 * byte-identical output (the fence test pins this).
 *
 * The fragment runs in the browser at < 5 ms before first paint. It:
 *   1. Reads the three `BEACON_KEYS` from localStorage (try/catch each).
 *   2. Derives the tier with the same logic as `deriveTier()`.
 *   3. Writes `data-recognition-tier` and (if known) `data-archetype`
 *      to `<html>`.
 *   4. Writes `--accent-bias` (deg) and `--thread-alpha-pre` (rung
 *      sentinel) as CSS custom props on `<html>`.
 *
 * IMPORTANT: every `var` declaration here uses `var` (not `let`/`const`)
 * — the script source is concatenated into the existing thermal IIFE,
 * which is a `var`-only block. Every `JSON.parse` is wrapped in
 * `try/catch` with a safe-default branch (matches the existing thermal
 * block). Script size budget: ≤ 1 KB minified (existing thermal block
 * is ~3.7 KB; this adds < 1 KB).
 */
export function beaconScriptFragment(): string {
  return [
    BEACON_FRAGMENT_READ,
    BEACON_FRAGMENT_TIER,
    BEACON_FRAGMENT_BIAS,
    BEACON_FRAGMENT_WRITE,
  ].join('');
}

/* ─── Fragment kernels — kept ≤ 10 LOC each, composed by the helper above ──
   Each fragment is a sub-string of the IIFE; the helper joins them in
   order. Splitting the source into named fragments lets the test verify
   each kernel by name rather than scraping a 2KB blob. */

/** Read the three localStorage signals, defaulting on parse failure. */
const BEACON_FRAGMENT_READ =
  `var ak=null;try{var ar=localStorage.getItem('quick-mirror-result');`
  + `if(ar){var aj=JSON.parse(ar);if(aj&&aj.archetype)ak=aj.archetype;}}catch(_e){}`
  + `var sn=0;try{var sr=localStorage.getItem('mirror_snapshots');`
  + `if(sr){var sa=JSON.parse(sr);sn=sa&&sa.length?sa.length:0;}}catch(_e){}`
  + `var vc=0;try{var mr=localStorage.getItem('reading_memory');`
  + `if(mr){var mo=JSON.parse(mr);vc=mo?Object.keys(mo).length:0;}}catch(_e){}`;

/** Derive tier — mirror of `deriveTier()` above (and of the existing
 *  `useReturnRecognition.resolveTier` — archetype-only-no-visits is
 *  STRANGER, not returning, by the React hook's contract). */
const BEACON_FRAGMENT_TIER =
  `var tier='stranger';`
  + `if(ak&&sn>0)tier='known';`
  + `else if(vc>=2)tier='returning';`;

/** Map archetype → accent-bias degrees — mirror of `archetypeAccentBias()`. */
const BEACON_FRAGMENT_BIAS =
  `var bias=null;`
  + `if(ak==='deep-diver')bias=280;`
  + `else if(ak==='explorer')bias=38;`
  + `else if(ak==='faithful')bias=12;`
  + `else if(ak==='resonator')bias=320;`
  + `else if(ak==='collector')bias=200;`;

/** Write the data-attrs and CSS custom props on `<html>`. */
const BEACON_FRAGMENT_WRITE =
  `var de=document.documentElement;`
  + `de.setAttribute('data-recognition-tier',tier);`
  + `if(ak)de.setAttribute('data-archetype',ak);`
  + `if(bias!==null)de.style.setProperty('--accent-bias',bias+'deg');`
  + `if(tier==='returning')de.style.setProperty('--thread-alpha-pre','var(--sys-alpha-muted)');`
  + `else if(tier==='known')de.style.setProperty('--thread-alpha-pre','var(--sys-alpha-recede)');`;

// ─── Module-graph fence inputs — read by the `.fence.test.ts` ────────────

/**
 * The literal `'quick-mirror-result'` string MUST live only here in the
 * `lib/return/` graph (mirrors how `inline-restore.ts` is the only
 * thermal-history reader). This export gives the fence test one address
 * to grep against. Single-reader invariant.
 */
export const BEACON_SINGLE_READER_TOKEN = BEACON_KEYS.archetype;
