/**
 * Snapshot Manager — DB operations for mirror_snapshots.
 * Append-only log of reader state at each Mirror visit.
 */

import { getDb } from '../db';
import type { MirrorSnapshot, SnapshotMeta } from '../../types/mirror';

type Scores = { depth: number; breadth: number; consistency: number };
type TopicDNA = { topic: string; weight: number }[];

export function createSnapshot(
  fp: string,
  archetype: string,
  scores: Scores,
  topicDNA: TopicDNA
): void {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const existing = db.prepare(
    `SELECT id FROM mirror_snapshots
     WHERE emailFingerprint = ? AND date(createdAt) = ?`
  ).get(fp, today);
  if (existing) return; // throttle: one snapshot per day

  db.prepare(
    `INSERT INTO mirror_snapshots (emailFingerprint, archetype, scores, topicDNA)
     VALUES (?, ?, ?, ?)`
  ).run(fp, archetype, JSON.stringify(scores), JSON.stringify(topicDNA));
}

export function getHistory(fp: string, limit = 10): MirrorSnapshot[] {
  const rows = getDb().prepare(
    `SELECT * FROM mirror_snapshots
     WHERE emailFingerprint = ? ORDER BY createdAt DESC LIMIT ?`
  ).all(fp, limit) as RawRow[];
  return rows.map(parseRow);
}

export function getMeta(fp: string): SnapshotMeta {
  const db = getDb();
  const count = db.prepare(
    `SELECT COUNT(*) as n FROM mirror_snapshots WHERE emailFingerprint = ?`
  ).get(fp) as { n: number };
  const first = db.prepare(
    `SELECT createdAt FROM mirror_snapshots
     WHERE emailFingerprint = ? ORDER BY createdAt ASC LIMIT 1`
  ).get(fp) as { createdAt: string } | undefined;
  const prev = db.prepare(
    `SELECT createdAt FROM mirror_snapshots
     WHERE emailFingerprint = ? ORDER BY createdAt DESC LIMIT 1 OFFSET 1`
  ).get(fp) as { createdAt: string } | undefined;
  return {
    visitCount: count.n,
    firstVisitAt: first?.createdAt ?? null,
    previousVisitAt: prev?.createdAt ?? null,
  };
}

interface RawRow {
  id: number; emailFingerprint: string; archetype: string;
  scores: string; topicDNA: string; createdAt: string;
}

function parseRow(r: RawRow): MirrorSnapshot {
  return {
    id: r.id, emailFingerprint: r.emailFingerprint,
    archetype: r.archetype, createdAt: r.createdAt,
    scores: JSON.parse(r.scores),
    topicDNA: JSON.parse(r.topicDNA),
  };
}
