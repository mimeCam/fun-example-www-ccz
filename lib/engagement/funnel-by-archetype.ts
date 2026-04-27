/**
 * funnel-by-archetype — read path for the loop funnel grouped by archetype.
 *
 * The 80%-built half: `loop_funnel.archetype` has been written to since day
 * one but never read back out — every aggregate folded the column into a
 * single row. This module exposes the grouping so the admin page (and
 * future polish tickets) can finally compare control vs. each archetype
 * arm.
 *
 * Reuses `CHECKPOINT_NAMES` as the SQL column whitelist — no string
 * literals leak into the query — and the same week derivation as
 * `getWeeklyFunnel`. NULL archetypes are bucketed as `'unbucketed'` so
 * the UI can spot pre-bucket rows (a one-time concern after deploy).
 *
 * Credits: Mike K. (napkin §4 file-2, §6 — group-by week+archetype, reuse
 * the checkpoint whitelist, no migration), Paul K. (Keepsake share rate
 * per archetype = the only metric), Elon M. (§7 move 2 — let the data
 * speak per arm).
 */

import { getDb } from '@/lib/db';
import { CHECKPOINT_NAMES } from '@/lib/engagement/loop-checkpoints';

/** Sentinel label for rows whose `archetype` column is NULL (pre-bucket). */
export const UNBUCKETED_LABEL = 'unbucketed';

/** Aggregate row — one per (week, archetype) pair. Numeric, NULL-safe. */
export interface FunnelByArchetypeRow {
  week: string;
  archetype: string;
  landed: number;
  resolved: number;
  warmed: number;
  keepsaked: number;
  shared: number;
}

/** Default observation window — matches `getWeeklyFunnel`. */
const DEFAULT_WINDOW_DAYS = 28;

/** Build the GROUP BY (week, archetype) SQL. Pure. */
function buildQuery(): string {
  return `
    SELECT
      strftime('%Y-%W', datetime(firstAt / 1000, 'unixepoch')) AS week,
      COALESCE(archetype, '${UNBUCKETED_LABEL}')              AS archetype,
      SUM(landed)    AS landed,
      SUM(resolved)  AS resolved,
      SUM(warmed)    AS warmed,
      SUM(keepsaked) AS keepsaked,
      SUM(shared)    AS shared
    FROM loop_funnel
    WHERE firstAt >= ?
    GROUP BY week, archetype
    ORDER BY week DESC, archetype ASC
  `;
}

/** Coerce SQL nulls to 0 across every checkpoint column. Pure. */
function coerceRow(row: FunnelByArchetypeRow): FunnelByArchetypeRow {
  const out = { week: row.week, archetype: row.archetype } as FunnelByArchetypeRow;
  out.landed = Number(row.landed ?? 0);
  CHECKPOINT_NAMES.forEach((c) => {
    (out as unknown as Record<string, number>)[c] = Number(
      (row as unknown as Record<string, unknown>)[c] ?? 0,
    );
  });
  return out;
}

/**
 * Aggregate the funnel by ISO week AND archetype for the last `days` days
 * (default 28). One row per (week, archetype) pair. NULL archetypes
 * collapse into `'unbucketed'` so they remain visible to the operator.
 */
export function getWeeklyFunnelByArchetype(
  days: number = DEFAULT_WINDOW_DAYS,
): FunnelByArchetypeRow[] {
  try {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const rows = getDb().prepare(buildQuery()).all(cutoff);
    return (rows as FunnelByArchetypeRow[]).map(coerceRow);
  } catch (error) {
    console.error('Failed to read weekly funnel by archetype:', error);
    return [];
  }
}

/** Sum a (week-collapsed) totals row per archetype. Pure, no DB. */
export function totalsByArchetype(
  rows: ReadonlyArray<FunnelByArchetypeRow>,
): Map<string, FunnelByArchetypeRow> {
  const out = new Map<string, FunnelByArchetypeRow>();
  rows.forEach((r) => addRowInto(out, r));
  return out;
}

/** Internal: accumulate one row into the totals map. ≤ 10 LOC. */
function addRowInto(
  acc: Map<string, FunnelByArchetypeRow>,
  row: FunnelByArchetypeRow,
): void {
  const prior = acc.get(row.archetype) ?? emptyRow(row.archetype);
  acc.set(row.archetype, {
    week: 'all',
    archetype: row.archetype,
    landed:    prior.landed    + row.landed,
    resolved:  prior.resolved  + row.resolved,
    warmed:    prior.warmed    + row.warmed,
    keepsaked: prior.keepsaked + row.keepsaked,
    shared:    prior.shared    + row.shared,
  });
}

/** Empty row for a freshly-seen archetype label. Pure. */
function emptyRow(archetype: string): FunnelByArchetypeRow {
  return {
    week: 'all', archetype,
    landed: 0, resolved: 0, warmed: 0, keepsaked: 0, shared: 0,
  };
}
