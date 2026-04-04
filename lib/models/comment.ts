import { getDb } from '../db';
import type { Comment, CreateCommentInput, CommentUpvote, CreateCommentUpvoteInput, CommentWithReplies } from '@/types/comment';

export class CommentModel {
  private db = getDb();

  create(input: CreateCommentInput): Comment {
    const stmt = this.db.prepare(`
      INSERT INTO comments (articleId, authorName, authorEmail, content, parentId)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      input.articleId,
      input.authorName,
      input.authorEmail,
      input.content,
      input.parentId || null
    );

    return this.findById(result.lastInsertRowid as number);
  }

  findById(id: number): Comment {
    const stmt = this.db.prepare('SELECT * FROM comments WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) {
      throw new Error('Comment not found');
    }

    return this.mapRowToComment(row);
  }

  findByArticleId(articleId: string): CommentWithReplies[] {
    const stmt = this.db.prepare(`
      SELECT * FROM comments
      WHERE articleId = ? AND parentId IS NULL
      ORDER BY upvotes - downvotes DESC, createdAt DESC
    `);
    const rows = stmt.all(articleId) as any[];

    return rows.map(row => this.mapRowToCommentWithReplies(row));
  }

  findReplies(parentId: number): Comment[] {
    const stmt = this.db.prepare(`
      SELECT * FROM comments
      WHERE parentId = ?
      ORDER BY upvotes - downvotes DESC, createdAt DESC
    `);
    const rows = stmt.all(parentId) as any[];

    return rows.map(row => this.mapRowToComment(row));
  }

  updateVoteCounts(commentId: number): void {
    const upvotesStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM comment_upvotes
      WHERE commentId = ? AND voteType = 'up'
    `);
    const downvotesStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM comment_upvotes
      WHERE commentId = ? AND voteType = 'down'
    `);

    const upvotesResult = upvotesStmt.get(commentId) as any;
    const downvotesResult = downvotesStmt.get(commentId) as any;

    const updateStmt = this.db.prepare(`
      UPDATE comments
      SET upvotes = ?, downvotes = ?
      WHERE id = ?
    `);

    updateStmt.run(
      upvotesResult.count,
      downvotesResult.count,
      commentId
    );
  }

  upvote(input: CreateCommentUpvoteInput): CommentUpvote {
    // Check if user already voted
    const checkStmt = this.db.prepare(`
      SELECT * FROM comment_upvotes
      WHERE commentId = ? AND userEmail = ?
    `);
    const existing = checkStmt.get(input.commentId, input.userEmail) as any;

    if (existing) {
      // Update existing vote
      const stmt = this.db.prepare(`
        UPDATE comment_upvotes
        SET voteType = ?
        WHERE commentId = ? AND userEmail = ?
      `);
      stmt.run(input.voteType, input.commentId, input.userEmail);

      this.updateVoteCounts(input.commentId);

      const updatedStmt = this.db.prepare(`
        SELECT * FROM comment_upvotes WHERE id = ?
      `);
      return updatedStmt.get(existing.id) as CommentUpvote;
    }

    // Create new vote
    const stmt = this.db.prepare(`
      INSERT INTO comment_upvotes (commentId, userEmail, voteType)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(
      input.commentId,
      input.userEmail,
      input.voteType
    );

    this.updateVoteCounts(input.commentId);

    const selectStmt = this.db.prepare('SELECT * FROM comment_upvotes WHERE id = ?');
    return selectStmt.get(result.lastInsertRowid) as CommentUpvote;
  }

  getUserVote(commentId: number, userEmail: string): 'up' | 'down' | null {
    const stmt = this.db.prepare(`
      SELECT voteType FROM comment_upvotes
      WHERE commentId = ? AND userEmail = ?
    `);
    const result = stmt.get(commentId, userEmail) as any;

    return result?.voteType || null;
  }

  private mapRowToComment(row: any): Comment {
    return {
      id: row.id,
      articleId: row.articleId,
      authorName: row.authorName,
      authorEmail: row.authorEmail,
      content: row.content,
      parentId: row.parentId,
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapRowToCommentWithReplies(row: any): CommentWithReplies {
    const comment = this.mapRowToComment(row);
    const replies = this.findReplies(comment.id);
    return {
      ...comment,
      replies: replies.length > 0 ? replies : undefined,
    };
  }
}
