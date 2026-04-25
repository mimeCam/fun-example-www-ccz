/**
 * read-progress — pure caption resolver for the Sundial Caption.
 *
 * The label beneath the article H1 (`5 min read` today) graduates to a
 * three-state, scroll-driven typographic surface: publisher's promise →
 * reader's presence → reader's testimony.
 *
 *   state 0 · `5 min read`     · maxDepth < 0.15  · isComplete = false
 *   state 1 · `~3 min left`    · maxDepth ≥ 0.15  · isComplete = false
 *   state 2 · `read`           · isComplete = true (terminal, latched)
 *
 * Sundial invariant (load-bearing — Mike #43, Tanya #77):
 *   This module takes no Date, no `now`, no timer ref, no clock of any
 *   kind. The string returned is a pure function of the three primitive
 *   inputs (readTime, maxDepth, isComplete). If a future PR ever needs
 *   to add a time input here, by definition it is building a different
 *   component. The unit "min" in `~N min left` is content-pace minutes
 *   (the publisher's estimate scaled by remaining depth) — NOT wall-
 *   clock minutes. We never measure; we only scale.
 *
 * Purity is enforced structurally by:
 *   1. The signature itself — three primitives in, one string out.
 *   2. The import-graph guard test in `__tests__/read-progress.test.ts`,
 *      which fails the build if `Date`, `setInterval`, `setTimeout`, or
 *      `performance` ever appear in this file.
 *
 * Credits: Mike K. (#43 napkin — helper signature, the import-graph
 * moat, no-new-ledger discipline, the 15% floor as documented taste),
 * Tanya D. (#77 — the three states, the tense framing, the `~` honesty
 * disclaimer, the four-letter testimony), Krystle C. (referenced via
 * Mike — three-state scope, helper signature, SSR-parity guard), Elon M.
 * (referenced via Mike — pure-function framing + the "no clock" honesty
 * about scaled minutes), Paul K. (referenced via Mike — "the caption
 * must never move unless the reader moves" as the structural rule).
 */

// ─── Constants — pinned, documented, grep-stable ────────────────────────

/**
 * The depth threshold at which the caption transitions from the
 * publisher's promise (state 0) to the reader's presence (state 1).
 * 0.15 = 15% maxDepth. Taste, not physics — Mike #43 §"Points of
 * interest" #5. If user testing later moves it to 0.12 or 0.20, no
 * thesis breaks because the helper signature does not change.
 */
export const READ_PROGRESS_FLOOR = 0.15;

/**
 * The minimum value rendered in `~N min left` before the testimony
 * latches. We never render `~0 min left` — that is a clock-flavored
 * failure mode (Tanya #77 §2.1). Until completion, the floor holds
 * at one minute.
 */
export const MIN_REMAINING = 1;

/**
 * The terminal string. Four lowercase letters, no period, no glyph,
 * no celebration. A receipt, not a metric. (Tanya #77 §2 — testimony
 * tense.)
 */
export const TESTIMONY = 'read';

// ─── Tiny pure formatters — each ≤ 10 LOC ───────────────────────────────

/** State 0 · `{readTime} min read` — byte-identical to today's literal. */
export function formatPromise(readTime: number): string {
  return `${readTime} min read`;
}

/**
 * State 1 · `~N min left`. Scales the publisher's estimate by remaining
 * depth, never the wall clock. The `~` prefix is the honest disclaimer
 * the unit deserves (Tanya #77 §2 copy rules).
 */
export function formatPresence(readTime: number, maxDepth: number): string {
  const scaled = Math.round(readTime * (1 - maxDepth));
  const remaining = Math.max(MIN_REMAINING, scaled);
  return `~${remaining} min left`;
}

// ─── The resolver — three primitives in, one string out ─────────────────

/**
 * formatReadProgress — the entire feature in one pure function.
 *
 * @param readTime    The publisher's estimate in whole minutes.
 * @param maxDepth    Peak scroll depth, 0..1 (NOT 0..100). Callers
 *                    that pull from `useScrollDepth()` must divide by
 *                    100 at the boundary; the context's 0..100 is a
 *                    legacy convenience, the helper takes the natural
 *                    unit.
 * @param isComplete  Genuine-completion latch. Once true, it wins
 *                    every other branch — the caller is responsible
 *                    for never flipping this back to false within a
 *                    session (the helper is pure; the latch lives in
 *                    the caller's hook, `useGenuineCompletion`).
 * @returns           The caption string for the current state.
 */
export function formatReadProgress(
  readTime: number,
  maxDepth: number,
  isComplete: boolean,
): string {
  if (isComplete) return TESTIMONY;
  if (maxDepth < READ_PROGRESS_FLOOR) return formatPromise(readTime);
  return formatPresence(readTime, maxDepth);
}

// ─── Helpers for callers (keeps the boundary thin at the seam) ──────────

/**
 * Scroll-depth boundary adapter. The `useScrollDepth()` context yields
 * `maxDepth` as 0..100 for legacy reasons; the helper takes 0..1. This
 * tiny adapter keeps the conversion in one place so both the component
 * and its tests use the same arithmetic. Pure, deterministic, ≤10 LOC.
 */
export function normalizeDepth(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  if (percent <= 0) return 0;
  if (percent >= 100) return 1;
  return percent / 100;
}

/**
 * Stable React key for the caption span. The keyed re-mount is what
 * triggers the existing `[data-sys-enter="fade"]` 120ms crossfade —
 * latest state wins, in-flight crossfade is cancelled and replaced
 * (Tanya #77 §4 fast-flick determinism). Returns a short label that is
 * stable per state so two equivalent renders do not re-mount.
 */
export type ReadProgressKey = 'promise' | 'presence' | 'testimony';

export function readProgressKey(
  maxDepth: number,
  isComplete: boolean,
): ReadProgressKey {
  if (isComplete) return 'testimony';
  if (maxDepth < READ_PROGRESS_FLOOR) return 'promise';
  return 'presence';
}

/**
 * Branded tuple type for tests that want to feed a fixture set through
 * the resolver without losing argument-position type safety. Kept here
 * so the contract lives next to its only consumer (the test file).
 */
export type ReadProgressInput = readonly [
  readTime: number,
  maxDepth: number,
  isComplete: boolean,
];
