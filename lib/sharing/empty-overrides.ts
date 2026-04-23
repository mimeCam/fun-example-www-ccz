/**
 * empty-overrides — the reviewed allow-list of literal headline / whisper
 * strings that are exempt from the `empty-adoption` tone scanner.
 *
 * Parallel to `poetic-overrides.ts` but for the empty / threshold rooms.
 * The voice of the four quietest rooms flows through
 * `@/lib/sharing/empty-phrase.ts#emptyPhrase(kind)`. A call-site that
 * hard-codes `"Nothing here yet."` into an `<EmptySurface />` headline prop
 * is a small lie that rots — it escapes every tone bucket the reader's
 * archetype maps to. `empty-adoption.test.ts` rejects those literals unless
 * the phrase appears in this Set (or in `POETIC_OVERRIDES`, for the rare
 * cross-surface quote that toast and empty share).
 *
 * Growth discipline (Mike K. napkin §5, §11 — ~6 entries is the smell):
 *  - Each entry is a permanent voice exception.
 *  - Adding one requires a reviewer comment explaining why the lexicon
 *    cannot carry the phrase.
 *  - Past six entries, the next sprint extends `reply-lexicon.ts` with a
 *    new `ReplyKind` instead of growing the override set.
 *
 * Starts empty — all four surfaces currently route through the lexicon.
 * Any literal added here is a reviewer-visible promise that the string is
 * curated, not accidental.
 *
 * Credits: Mike K. (napkin §9 — parallel to poetic-overrides; six-entry
 * smell threshold), Tanya D. (§7 — overrides stay poetic, not structural),
 * Elon M. (§3 — the override set is the allow-list that makes the voice
 * marker honest).
 */

/**
 * Reviewed literal strings that may appear in an `<EmptySurface />` headline
 * or whisper prop without routing through `emptyPhrase` / `phraseFor`. Any
 * new entry here must be added (line-by-line) before the adoption guard
 * accepts it.
 */
export const EMPTY_OVERRIDES: ReadonlySet<string> = new Set<string>([
  // intentionally empty — all four surfaces currently route through the lexicon
]);

/**
 * The six-entry smell threshold from Mike §11. Past this, the next sprint
 * extends `reply-lexicon.ts` with a new `ReplyKind` instead of growing the
 * override set.
 */
export const EMPTY_OVERRIDES_MAX_ENTRIES = 6;
