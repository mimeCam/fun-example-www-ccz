/**
 * Reader Loop Funnel — stateless persistence for the 4 checkpoints that
 * shape a reading session: `resolved`, `warmed`, `keepsaked`, `shared`.
 * `landed` is implicit (any first checkpoint creates the row).
 *
 * One row per session, monotonic boolean flags (`MAX(flag, 1)`), idempotent.
 * The aggregate is the curve we polish against.
 *
 * Credits: Mike K. (napkin §4 + §6 — table shape, monotonic flags, FK as
 * advisory, no PII), Paul Kim (the four-checkpoint shape — *land → resolve
 * → warm → keepsake → share*), Tanya D. (the gentle reminder that the
 * meter is not the message — keep it invisible to the reader).
 */

import { getDb } from '@/lib/db';
import {
  CHECKPOINTS, CHECKPOINT_NAMES, type CheckpointName,
} from '@/lib/engagement/loop-checkpoints';

export { CHECKPOINTS, type CheckpointName };

/** Input for `recordCheckpoint`. `archetype` is optional + immutable once set. */
export interface RecordCheckpointInput {
  sessionId: string;
  articleId: string;
  checkpoint: CheckpointName;
  archetype?: string | null;
}

/** Aggregate shape returned by `getWeeklyFunnel`. One row per ISO week. */
export interface WeeklyFunnelRow {
  week: string;        // 'YYYY-WW'
  landed: number;
  resolved: number;
  warmed: number;
  keepsaked: number;
  shared: number;
}

/** Whitelist guard — only known column names ever reach SQL. */
function isCheckpointColumn(name: string): name is CheckpointName {
  return (CHECKPOINT_NAMES as ReadonlyArray<string>).includes(name);
}

/** Insert a stub row for a brand-new session. `landed` defaults to 1. */
function insertStub(input: RecordCheckpointInput, now: number): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO loop_funnel
      (sessionId, articleId, archetype, firstAt, lastAt)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(input.sessionId, input.articleId, input.archetype ?? null, now, now);
}

/** Promote a single flag to 1; refresh `lastAt` and the archetype if absent. */
function promoteFlag(input: RecordCheckpointInput, now: number): void {
  const col = input.checkpoint;
  if (!isCheckpointColumn(col)) return;
  const db = getDb();
  const stmt = db.prepare(
    `UPDATE loop_funnel
       SET ${col} = MAX(${col}, 1),
           archetype = COALESCE(archetype, ?),
           lastAt = ?
     WHERE sessionId = ?`,
  );
  stmt.run(input.archetype ?? null, now, input.sessionId);
}

/**
 * Record a checkpoint. Creates the session row on first call (implicit
 * `landed`), then promotes the named boolean flag. Idempotent — repeated
 * calls update only `lastAt`.
 */
export function recordCheckpoint(input: RecordCheckpointInput): boolean {
  try {
    const now = Date.now();
    insertStub(input, now);
    promoteFlag(input, now);
    return true;
  } catch (error) {
    console.error('Failed to record loop checkpoint:', error);
    return false;
  }
}

/** Sum a single column over the last `days` days, grouped by ISO week. */
function buildWeeklyQuery(): string {
  return `
    SELECT
      strftime('%Y-%W', datetime(firstAt / 1000, 'unixepoch')) AS week,
      SUM(landed)    AS landed,
      SUM(resolved)  AS resolved,
      SUM(warmed)    AS warmed,
      SUM(keepsaked) AS keepsaked,
      SUM(shared)    AS shared
    FROM loop_funnel
    WHERE firstAt >= ?
    GROUP BY week
    ORDER BY week DESC
  `;
}

/**
 * Aggregate the funnel by ISO week for the last `days` days (default 28).
 * Returns one row per week with totals across the 4 monotonic flags plus
 * the implicit `landed` count.
 */
export function getWeeklyFunnel(days: number = 28): WeeklyFunnelRow[] {
  try {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const rows = getDb().prepare(buildWeeklyQuery()).all(cutoff);
    return (rows as WeeklyFunnelRow[]).map(coerceWeeklyRow);
  } catch (error) {
    console.error('Failed to read weekly funnel:', error);
    return [];
  }
}

/** Coerce SQL nulls to 0 — `SUM` over an empty group returns NULL. */
function coerceWeeklyRow(row: WeeklyFunnelRow): WeeklyFunnelRow {
  return {
    week: row.week,
    landed: Number(row.landed ?? 0),
    resolved: Number(row.resolved ?? 0),
    warmed: Number(row.warmed ?? 0),
    keepsaked: Number(row.keepsaked ?? 0),
    shared: Number(row.shared ?? 0),
  };
}
