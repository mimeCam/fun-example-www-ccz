/**
 * reply-resolve — pure-TS tone resolution at the share seam.
 *
 * The one verb pure-TS share callers (`clipboard-utils`, quote-card
 * `export-utils`) use to ask the lexicon — instead of their own English —
 * for the curated phrase. Composition is trivial by design:
 *
 *   phraseFor(kind, archetypeToTone(readStoredArchetype()))
 *
 * The hook (`useToast`) keeps doing the same resolution React-side; this
 * module is for the callers that can't (won't) call hooks. No React, no
 * DOM, SSR-safe (`readStoredArchetype` returns `null` on the server →
 * `archetypeToTone(null)` → `DEFAULT_TONE`).
 *
 * Credits: Jason F. (tone resolves at the seam, not at the render),
 * Mike K. (napkin §4 — single verb, single import, no threading
 * `archetype` through), Tanya D. (§7.2 under-tinting — only reflective
 * tints; kinetic & analytical converge on the neutral default), Elon M.
 * (§3 minimum viable: do not add `replyPhraseWithTone(...)` until a real
 * caller arrives).
 */

import { readStoredArchetype } from '@/lib/mirror/archetype-store';
import {
  archetypeToTone, phraseFor, type ReplyKind,
} from '@/lib/sharing/reply-lexicon';

/**
 * Resolve the curated phrase for a share-seam reply, tinted by the reader's
 * stored archetype. If no archetype is stored (or we're on the server),
 * folds to `DEFAULT_TONE` — a neutral phrase the room won't over-perform.
 */
export function replyPhrase(kind: ReplyKind): string {
  return phraseFor(kind, archetypeToTone(readStoredArchetype()));
}
