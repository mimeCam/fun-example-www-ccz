/**
 * loop-checkpoints — pure constants for the Reader Loop Funnel.
 *
 * Carved out of `loop-funnel.ts` so the client hook (`useLoopFunnel`) can
 * import these names without dragging the better-sqlite3 transitive into
 * the client bundle. Server-side persistence stays in `loop-funnel.ts`.
 *
 * No runtime, no side-effects, no imports — safe to consume from anywhere.
 */

/** Canonical names of the 4 trackable checkpoints. `landed` is implicit. */
export const CHECKPOINTS = {
  RESOLVED: 'resolved',
  WARMED: 'warmed',
  KEEPSAKED: 'keepsaked',
  SHARED: 'shared',
} as const;

export type CheckpointName = (typeof CHECKPOINTS)[keyof typeof CHECKPOINTS];

/** Stable ordered list — handy for SQL column whitelists + iteration. */
export const CHECKPOINT_NAMES: ReadonlyArray<CheckpointName> = [
  CHECKPOINTS.RESOLVED, CHECKPOINTS.WARMED,
  CHECKPOINTS.KEEPSAKED, CHECKPOINTS.SHARED,
];
