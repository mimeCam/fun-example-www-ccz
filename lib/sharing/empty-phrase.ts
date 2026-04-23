/**
 * empty-phrase — pure-TS tone resolution for the empty / threshold rooms.
 *
 * Sibling to `reply-resolve.ts`, but for the four quietest rooms of the site:
 * empty-mirror, empty-resonances, 404, and the error boundary. One verb, one
 * import, zero React. The composition is the same on purpose:
 *
 *   phraseFor(kind, archetypeToTone(readStoredArchetype()))   → headline
 *   whisperFor(kind, archetypeToTone(readStoredArchetype())) → whisper
 *
 * Why a sibling and not a reuse of `replyPhrase`? The typed surface. Empty
 * surfaces are not confirm-shaped; the caller should be statically prevented
 * from asking for `emptyPhrase('copy-text')`. The `EmptySurfaceKind` subset
 * carries that guarantee — no runtime branch.
 *
 * Empty surfaces speak in two lines — the headline IS the anchor, the
 * whisper IS the invitation. Both flow through the lexicon so the voice
 * cannot rot. A single `emptyPhrase(kind)` call returns both, keeping the
 * call-site short (one verb, one import) and keeping the adoption scanner
 * shape-identical to the toast scanner.
 *
 * SSR-safe — `readStoredArchetype()` returns `null` on the server, which
 * folds to `DEFAULT_TONE = 'kinetic'`. That IS the first-visit curious voice
 * (Paul §stakes), delivered via curated `kinetic`-column English instead of
 * a 4th tone bucket (Elon §3.1 — the rectangle stays rectangular).
 *
 * Credits: Mike K. (napkin §3 item #2 — sibling module, one verb, one
 * import), Elon M. (§3 cold-start physics — null → kinetic is the right
 * default, no thermal coupling), Paul K. (first-visit is the highest-traffic,
 * lowest-personalized surface — the fallback IS the product there), Tanya D.
 * (§2.5 — the frame holds regardless of which tone-resolution path the
 * lexicon settles on).
 */

import { readStoredArchetype } from '@/lib/mirror/archetype-store';
import {
  archetypeToTone, phraseFor, whisperFor,
  type EmptySurfaceKind,
} from '@/lib/sharing/reply-lexicon';

/**
 * Resolved voice for an empty / threshold surface. Both lines flow through
 * the lexicon — a caller handing either one off to `<EmptySurface />` is
 * handing off a curated string the adoption guard has already blessed.
 */
export interface EmptyPhrase {
  readonly headline: string;
  readonly whisper: string;
}

/**
 * Resolve the curated headline + whisper for one of the four empty /
 * threshold rooms, tinted by the reader's stored archetype. If no archetype
 * is stored (or we are rendering on the server), folds to `DEFAULT_TONE` —
 * the curious, non-over-performed first-visit voice.
 */
export function emptyPhrase(kind: EmptySurfaceKind): EmptyPhrase {
  const tone = archetypeToTone(readStoredArchetype());
  return {
    headline: phraseFor(kind, tone),
    whisper:  whisperFor(kind, tone),
  };
}
