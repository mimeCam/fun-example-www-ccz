/**
 * archetype-bucket — deterministic A/B bucket assignment for the loop funnel.
 *
 * The loop_funnel `archetype` column has been a mirror without a comparison —
 * every reader sees personalized copy, so every row is "treatment". With no
 * `'control'` bucket, the killer-feature ("archetype-tuned copy on the same
 * URL") cannot be A/B-tested against a null. This module fixes that by
 * routing ~10% of sessions to a stable `'control'` label that flows into
 * the existing checkpoint pipeline; the remaining ~90% pass through the
 * archetype unchanged.
 *
 * Discipline:
 *  - **Deterministic.** A given `sessionId` always lands in the same bucket
 *    across emits — frozen at first call so the four checkpoints of one
 *    session never split. Implemented with FNV-1a (32-bit, pure JS), which
 *    is small, fast, SSR-safe, and produces a uniform low-byte distribution
 *    suitable for a simple modulo split. No deps, no Web Crypto async dance.
 *  - **Pure.** No DOM, no DB, no `localStorage`. The hook owns the freezing
 *    by stashing the bucket on the first emit (see `useLoopFunnel.ts`).
 *  - **Falls through.** If the archetype is `null`/empty (the reader hasn't
 *    completed the Mirror yet), we still bucket: a non-null archetype is not
 *    a precondition; the bucket is the new identity field on the funnel row.
 *
 * Credits: Mike K. (napkin §2 + §4 file-1 — 70 LOC budget, pure/SSR-safe
 * mandate, ~10% control split, FNV-1a fallback for SSR safety), Paul K.
 * (the four-moment arc and the "compare against control" discipline that
 * makes this file have a reason to exist), Elon M. (§7 move 2 — control
 * bucket so polish tickets can name a number).
 */

/** Numeric label for the control bucket — no archetype-store collision. */
export const CONTROL_BUCKET = 'control';

/**
 * Default control share (fraction of sessions routed to `'control'`).
 * 10% is the canonical split: large enough to detect a 5pp lift in a week,
 * small enough that 90% of readers still receive the killer feature.
 */
export const DEFAULT_CONTROL_SHARE = 0.10;

/** Bucket modulo — `HASH_BUCKETS=1000` gives 0.1% resolution on the split. */
const HASH_BUCKETS = 1000;

/**
 * FNV-1a 32-bit. Pure, deterministic, ASCII-safe enough for our session
 * ids (UUIDs + timestamp-random hybrids). Returns an unsigned 32-bit int.
 * Inlined (~10 LOC) so this file has no transitive dependencies.
 */
export function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Map a hash to a bucket index in `[0, HASH_BUCKETS)`. Pure. */
function bucketIndex(sessionId: string): number {
  return fnv1a32(sessionId) % HASH_BUCKETS;
}

/**
 * Decide whether `sessionId` falls in the control split. Pure, deterministic.
 * `share` is clamped to `[0, 1]` so a misconfigured caller cannot starve
 * the treatment arm or break the modulo math.
 */
export function isControlSession(
  sessionId: string,
  share: number = DEFAULT_CONTROL_SHARE,
): boolean {
  const clamped = Math.max(0, Math.min(1, share));
  if (clamped === 0) return false;
  if (clamped === 1) return true;
  const cutoff = Math.floor(clamped * HASH_BUCKETS);
  return bucketIndex(sessionId) < cutoff;
}

/**
 * Resolve the bucket label for a session. Returns `'control'` for the
 * control split, otherwise the original `archetype` (or `null` if absent).
 *
 * This is the single seam used by `useLoopFunnel` to tag every checkpoint.
 * The bucket label flows untouched into the `archetype` column on
 * `loop_funnel`; the read path (`funnel-by-archetype.ts`) then groups by it.
 */
export function bucketFor(
  sessionId: string | null | undefined,
  archetype: string | null | undefined,
  share: number = DEFAULT_CONTROL_SHARE,
): string | null {
  const arch = archetype ? archetype : null;
  if (!sessionId) return arch;
  return isControlSession(sessionId, share) ? CONTROL_BUCKET : arch;
}
