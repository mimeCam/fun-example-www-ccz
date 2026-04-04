import { getDb } from '../db';
import type { Challenge, CreateChallengeInput } from '@/types/challenge';

export class ChallengeModel {
  private db = getDb();

  create(input: CreateChallengeInput): Challenge {
    const stmt = this.db.prepare(`
      INSERT INTO challenges (articleId, authorName, authorEmail, challengeText)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      input.articleId,
      input.authorName,
      input.authorEmail,
      input.challengeText
    );

    return this.findById(result.lastInsertRowid as number);
  }

  findById(id: number): Challenge {
    const stmt = this.db.prepare('SELECT * FROM challenges WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) {
      throw new Error('Challenge not found');
    }

    return this.mapRowToChallenge(row);
  }

  findByArticleId(articleId: string): Challenge[] {
    const stmt = this.db.prepare('SELECT * FROM challenges WHERE articleId = ? ORDER BY createdAt DESC');
    const rows = stmt.all(articleId) as any[];

    return rows.map(row => this.mapRowToChallenge(row));
  }

  // TODO: Add update and delete methods
  // TODO: Add status update method

  private mapRowToChallenge(row: any): Challenge {
    return {
      id: row.id,
      articleId: row.articleId,
      authorName: row.authorName,
      authorEmail: row.authorEmail,
      challengeText: row.challengeText,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
