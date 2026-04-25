/**
 * Recognition Surface Selector — the single source of truth for
 * which return-recognition primitive (Letter or Whisper) is allowed
 * to paint at any moment.
 *
 * Mounting `RecognitionWhisper` on `/article/[id]` while `ReturnLetter`
 * lives on `/` already gives mutual-exclusion at the route level. This
 * selector reinforces it as a typed return-value invariant — the rule
 * stops being a vibe ("Whisper happens to be unmounted") and becomes a
 * property the type system can carry.
 *
 * Pure, stateless, SSR-safe. No imports of React, no `window` reads.
 * The portal layer lifts side-effecty inputs (e.g. localStorage flags)
 * up and passes them in — keeping this module unit-testable without
 * jsdom magic.
 *
 * Credits: Mike Koch (architect, napkin §5 — selector contract & truth
 * table), Tanya Donska (UIX, §5.4 — accept "never both visible"),
 * Krystle Clear (VP Product — original mount proposal).
 */

import type { ArchetypeKey } from '@/types/content';
import type { ReturnRecognitionState } from '@/lib/hooks/useReturnRecognition';

/** The three possible verdicts. Exhaustive — the type system enforces it. */
export type RecognitionSurface = 'letter' | 'whisper' | 'silent';

/** Where the selector is being called from. Closed set; do not extend casually. */
export type SurfaceLocation = 'home' | 'article';

/**
 * Inputs the selector reads. Pure record — no functions, no Refs. The
 * portal layer is responsible for hydrating each field from its source
 * (hook, search params, localStorage helper).
 */
export interface RecognitionSurfaceContext {
  surface: SurfaceLocation;
  recognition: ReturnRecognitionState;
  /** Decoded from `?via=ARCHETYPE`, or `null` when absent. */
  viaArchetype: ArchetypeKey | null;
  /** 7-day localStorage flag, lifted by the portal so the selector stays pure. */
  letterDismissed: boolean;
}

/**
 * Pick the active recognition surface for a given context.
 *
 * Truth table (derived from existing behaviour, not invented):
 *
 *   surface  | tier        | viaArchetype | letterDismissed | result
 *   ─────────|─────────────|──────────────|─────────────────|─────────
 *   home     | stranger    |  —           |  —              | silent
 *   home     | returning   |  null        |  false          | letter
 *   home     | returning   |  null        |  true           | whisper
 *   home     | returning   |  non-null    |  —              | whisper
 *   home     | known       |  null        |  false          | letter
 *   home     | known       |  null        |  true           | whisper
 *   home     | known       |  non-null    |  —              | whisper
 *   article  | stranger    |  —           |  —              | silent
 *   article  | returning   |  —           |  —              | whisper
 *   article  | known       |  —           |  —              | whisper
 *   any      | (no whisper synthesised) | — | —             | silent (fail-quiet)
 *
 * Invariant: never returns the "wrong" rail. `letter` only on `home`.
 */
export function pickRecognitionSurface(ctx: RecognitionSurfaceContext): RecognitionSurface {
  const { recognition } = ctx;
  if (!recognition.isReturning) return 'silent';
  if (ctx.surface === 'article') return pickArticleSurface(ctx);
  return pickHomeSurface(ctx);
}

/** Article rail: returning/known → whisper; missing copy → silent. */
function pickArticleSurface(ctx: RecognitionSurfaceContext): RecognitionSurface {
  if (!ctx.recognition.lastWhisper) return 'silent';
  return 'whisper';
}

/** Home rail: deep-link or dismissed letter falls back to whisper, else letter. */
function pickHomeSurface(ctx: RecognitionSurfaceContext): RecognitionSurface {
  if (ctx.viaArchetype !== null) return whisperOrSilent(ctx);
  if (ctx.letterDismissed) return whisperOrSilent(ctx);
  return 'letter';
}

/** Whisper if a line was synthesised; otherwise stay quiet. */
function whisperOrSilent(ctx: RecognitionSurfaceContext): RecognitionSurface {
  return ctx.recognition.lastWhisper ? 'whisper' : 'silent';
}

// ─── localStorage lifting helpers ────────────────────────────────────
//
// Both helpers are SSR-safe (return their "no-op" value when `window`
// is undefined). They live alongside the selector so a single import
// gives the portal layer everything it needs.

/** Letter-dismissed flag — 7-day cooldown, mirrors ReturnLetter logic. */
export function readLetterDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const ts = window.localStorage.getItem('letter-dismissed-at');
    if (!ts) return false;
    return Date.now() - parseInt(ts, 10) < SEVEN_DAYS_MS;
  } catch { return false; }
}

const SEVEN_DAYS_MS = 7 * 86400000;
