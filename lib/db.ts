import Database from 'better-sqlite3';
import path from 'path';

// Database singleton
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'challenges.db');
    db = new Database(dbPath);

    // Initialize schema
    initializeSchema(db);
  }

  return db;
}

function initializeSchema(database: Database.Database): void {
  // Create challenges table
  database.exec(`
    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      articleId TEXT NOT NULL,
      authorName TEXT NOT NULL,
      authorEmail TEXT NOT NULL,
      challengeText TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create newsletter subscribers table
  database.exec(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      sourcePostType TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create engagement sessions table for progressive content revelation
  database.exec(`
    CREATE TABLE IF NOT EXISTS engagement_sessions (
      id TEXT PRIMARY KEY,
      articleId TEXT NOT NULL,
      startTime INTEGER NOT NULL,
      endTime INTEGER,
      duration INTEGER NOT NULL,
      unlocks INTEGER NOT NULL DEFAULT 0,
      deviceType TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create layer unlock events table for analytics
  database.exec(`
    CREATE TABLE IF NOT EXISTS layer_unlocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      articleId TEXT NOT NULL,
      layerId TEXT NOT NULL,
      thresholdMinutes INTEGER NOT NULL,
      unlockedAt INTEGER NOT NULL,
      timeToUnlock INTEGER NOT NULL,
      FOREIGN KEY (sessionId) REFERENCES engagement_sessions(id)
    )
  `);

  // Create index on email for faster lookups
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_newsletter_email
    ON newsletter_subscribers(email)
  `);

  // Create indexes for engagement queries
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_engagement_articles
    ON engagement_sessions(articleId)
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_layer_unlocks_articles
    ON layer_unlocks(articleId, layerId)
  `);

  // TODO: Add indexes for better query performance on challenges table
  // TODO: Add articles table when needed
}
