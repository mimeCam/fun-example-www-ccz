/**
 * loop-funnel — recordCheckpoint + getWeeklyFunnel.
 *
 * Tests the four invariants that make this meter trustworthy:
 *   1. The first emit creates the row with `landed=1`.
 *   2. Flags are monotonic — a second emit of the same checkpoint never
 *      decreases or duplicates.
 *   3. Different checkpoints on the same session promote individually.
 *   4. `getWeeklyFunnel` aggregates by ISO week and clips to the window.
 *
 * The DB is replaced with an in-memory better-sqlite3 instance so the
 * suite never touches `challenges.db` and runs in milliseconds.
 */

import Database from 'better-sqlite3';

let db: Database.Database;

function createSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS loop_funnel (
      sessionId  TEXT PRIMARY KEY,
      articleId  TEXT NOT NULL,
      archetype  TEXT,
      landed     INTEGER NOT NULL DEFAULT 1,
      resolved   INTEGER NOT NULL DEFAULT 0,
      warmed     INTEGER NOT NULL DEFAULT 0,
      keepsaked  INTEGER NOT NULL DEFAULT 0,
      shared     INTEGER NOT NULL DEFAULT 0,
      firstAt    INTEGER NOT NULL,
      lastAt     INTEGER NOT NULL
    )
  `);
}

jest.mock('@/lib/db', () => ({ getDb: () => db }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const lf = require('@/lib/engagement/loop-funnel') as
  typeof import('@/lib/engagement/loop-funnel');

beforeEach(() => {
  db = new Database(':memory:');
  createSchema(db);
});

afterEach(() => { db.close(); });

function readRow(sessionId: string) {
  return db.prepare(
    'SELECT * FROM loop_funnel WHERE sessionId = ?',
  ).get(sessionId) as Record<string, unknown> | undefined;
}

describe('recordCheckpoint — row creation', () => {
  it('first emit creates a row with landed=1 and the named flag set', () => {
    const ok = lf.recordCheckpoint({
      sessionId: 's1', articleId: 'a1', checkpoint: lf.CHECKPOINTS.RESOLVED,
      archetype: 'deep-diver',
    });
    expect(ok).toBe(true);
    const row = readRow('s1');
    expect(row).toBeDefined();
    expect(row?.landed).toBe(1);
    expect(row?.resolved).toBe(1);
    expect(row?.warmed).toBe(0);
    expect(row?.archetype).toBe('deep-diver');
  });

  it('archetype is preserved on repeat emits — never overwritten with null', () => {
    lf.recordCheckpoint({
      sessionId: 's1', articleId: 'a1', checkpoint: lf.CHECKPOINTS.RESOLVED,
      archetype: 'deep-diver',
    });
    lf.recordCheckpoint({
      sessionId: 's1', articleId: 'a1', checkpoint: lf.CHECKPOINTS.WARMED,
      archetype: null,
    });
    expect(readRow('s1')?.archetype).toBe('deep-diver');
  });
});

describe('recordCheckpoint — monotonic flags', () => {
  it('repeated emits of the same checkpoint never duplicate or decrease', () => {
    for (let i = 0; i < 3; i++) {
      lf.recordCheckpoint({
        sessionId: 's1', articleId: 'a1', checkpoint: lf.CHECKPOINTS.SHARED,
      });
    }
    expect(readRow('s1')?.shared).toBe(1);
    const count = db.prepare('SELECT COUNT(*) as n FROM loop_funnel').get() as { n: number };
    expect(count.n).toBe(1);
  });

  it('different checkpoints on the same session each promote independently', () => {
    lf.recordCheckpoint({ sessionId: 's1', articleId: 'a1', checkpoint: lf.CHECKPOINTS.RESOLVED });
    lf.recordCheckpoint({ sessionId: 's1', articleId: 'a1', checkpoint: lf.CHECKPOINTS.WARMED });
    lf.recordCheckpoint({ sessionId: 's1', articleId: 'a1', checkpoint: lf.CHECKPOINTS.SHARED });
    const row = readRow('s1');
    expect(row?.resolved).toBe(1);
    expect(row?.warmed).toBe(1);
    expect(row?.shared).toBe(1);
    expect(row?.keepsaked).toBe(0);
  });
});

describe('getWeeklyFunnel — aggregation', () => {
  function seed(sessionId: string, articleId: string, firstAt: number, flags: Record<string, number>) {
    db.prepare(`
      INSERT INTO loop_funnel
        (sessionId, articleId, landed, resolved, warmed, keepsaked, shared, firstAt, lastAt)
      VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId, articleId,
      flags.resolved ?? 0, flags.warmed ?? 0,
      flags.keepsaked ?? 0, flags.shared ?? 0,
      firstAt, firstAt,
    );
  }

  it('sums flags across rows in the window, ignoring older rows', () => {
    const now = Date.now();
    seed('s1', 'a1', now, { resolved: 1, warmed: 1 });
    seed('s2', 'a1', now, { resolved: 1, shared: 1 });
    seed('s3', 'a2', now - 60 * 24 * 60 * 60 * 1000, { resolved: 1 }); // 60d old
    const rows = lf.getWeeklyFunnel(28);
    const total = rows.reduce((sum, r) => sum + r.landed, 0);
    expect(total).toBe(2); // s3 excluded by 28-day window
    const resolvedTotal = rows.reduce((sum, r) => sum + r.resolved, 0);
    expect(resolvedTotal).toBe(2);
    const warmedTotal = rows.reduce((sum, r) => sum + r.warmed, 0);
    expect(warmedTotal).toBe(1);
  });

  it('returns an empty array when the table is empty', () => {
    expect(lf.getWeeklyFunnel(28)).toEqual([]);
  });

  it('coerces SQL nulls to 0 in every numeric column', () => {
    seed('s1', 'a1', Date.now(), {});
    const [row] = lf.getWeeklyFunnel(28);
    expect(typeof row.landed).toBe('number');
    expect(row.resolved).toBe(0);
    expect(row.shared).toBe(0);
  });
});
