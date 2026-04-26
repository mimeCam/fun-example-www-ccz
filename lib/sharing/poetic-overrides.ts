/**
 * poetic-overrides — the reviewed allow-list of literal toast messages
 * that are exempt from the lexicon's tone scanner (Axis B of the 6th
 * adoption guard).
 *
 * The voice of the site flows through `@/lib/sharing/reply-lexicon.ts` and
 * its pure-TS resolver `replyPhrase(kind)`. A call-site that hard-codes
 * `message: 'Copied!'` is a small lie that rots — it escapes every tone
 * bucket the reader's archetype maps to. `toast-adoption.test.ts`
 * catches those literals and rejects them unless the phrase appears here.
 *
 * Growth discipline (Mike K. napkin §5, §11 — ~6 entries is the smell):
 *  - Each entry is a permanent voice exception.
 *  - Adding one requires a code-review comment justifying why the lexicon
 *    cannot carry the phrase. That convention is not code-enforced — the
 *    small size of the set is what keeps it honest.
 *  - If the list grows past six entries, the sprint that adds the seventh
 *    should instead extend `reply-lexicon.ts` with a new `ReplyKind`.
 *
 * The current entries are the four poetic one-offs that flow through
 * `ThreadKeepsake`'s explicit `successMessage` / `failureMessage` props
 * (see `components/reading/ThreadKeepsake.tsx`). They land at
 * `toastShow(...)` only when the caller forwards them through the
 * `copyWithFeedback` / `showCopyFeedback` helpers — pre-seeded here so the
 * guard is honest about which literals the seam already blesses.
 *
 * Credits: Mike K. (napkin §5 — tiny Set, reviewed line-by-line; §11 —
 * the six-entry smell threshold), Tanya D. (UX §7 — kill-list for per-
 * surface variants; the overrides stay poetic, not structural), Elon M.
 * (§4 — tone scanner cannot ship without this file; it is the allow-list
 * that makes the AGENTS.md positioning line factually true).
 */

/**
 * Reviewed literal messages that may appear inside `toastShow({ message: ... })`
 * without routing through `replyPhrase` / `phraseFor`. Any new entry must be
 * added here (line-by-line review) before the adoption guard will accept it.
 *
 * Note (Mike #21 / Tanya #10 — the Quiet Keepsake): after the default-flip,
 * the keepsake's success literals never reach `toastShow` directly — they
 * flow through `copyWithFeedback({ successMessage })` and only escalate
 * to a toast when the caller explicitly opts into the room voice. The
 * entries below stay listed because they ARE the reviewed phrases the
 * keepsake hands to the helper; if a future grep accidentally re-introduces
 * one as a bare `toastShow` argument, we want the audit to recognise it
 * rather than fail-closed on a phrase the team already approved.
 */
export const POETIC_OVERRIDES: ReadonlySet<string> = new Set<string>([
  // ThreadKeepsake — the keepsake ceremony's poetic one-offs.
  'Link copied — the thread travels with it.',
  'Share unsupported — link copied instead.',
  "Couldn't copy — try Save instead.",
]);

/**
 * The six-entry smell threshold from Mike §11. Grown past this and the next
 * sprint should extend `reply-lexicon.ts` with a new `ReplyKind` instead.
 */
export const POETIC_OVERRIDES_MAX_ENTRIES = 6;
