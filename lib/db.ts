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

  // Create comments table for Thoughtful Conversations
  database.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      articleId TEXT NOT NULL,
      authorName TEXT NOT NULL,
      authorEmail TEXT NOT NULL,
      content TEXT NOT NULL,
      parentId INTEGER,
      upvotes INTEGER NOT NULL DEFAULT 0,
      downvotes INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (parentId) REFERENCES comments(id) ON DELETE CASCADE
    )
  `);

  // Create comment_upvotes table for tracking votes
  database.exec(`
    CREATE TABLE IF NOT EXISTS comment_upvotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      commentId INTEGER NOT NULL,
      userEmail TEXT NOT NULL,
      voteType TEXT NOT NULL CHECK(voteType IN ('up', 'down')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(commentId, userEmail),
      FOREIGN KEY (commentId) REFERENCES comments(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for comment queries
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_comments_article
    ON comments(articleId, createdAt DESC)
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_comments_parent
    ON comments(parentId)
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_comment_upvotes_comment
    ON comment_upvotes(commentId, userEmail)
  `);

  // Create reading_memory table for personal reading history
  database.exec(`
    CREATE TABLE IF NOT EXISTS reading_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      emailFingerprint TEXT NOT NULL,
      articleId TEXT NOT NULL,
      firstReadAt INTEGER NOT NULL,
      lastReadAt INTEGER NOT NULL,
      readCount INTEGER NOT NULL DEFAULT 1,
      totalReadingTime INTEGER NOT NULL DEFAULT 0,
      completionRate REAL NOT NULL DEFAULT 0.0,
      UNIQUE(emailFingerprint, articleId)
    )
  `);

  // Create indexes for reading memory queries
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_reading_memory_user
    ON reading_memory(emailFingerprint, lastReadAt DESC)
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_reading_memory_articles
    ON reading_memory(articleId)
  `);

  // Create editor_picks table for author-curated related posts
  database.exec(`
    CREATE TABLE IF NOT EXISTS editor_picks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_article_id TEXT NOT NULL,
      target_article_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(source_article_id, position)
    )
  `);

  // Create indexes for editor_picks queries
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_editor_picks_source
    ON editor_picks(source_article_id, position)
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_editor_picks_target
    ON editor_picks(target_article_id)
  `);

  // Create highlights table for silent highlighting feature
  database.exec(`
    CREATE TABLE IF NOT EXISTS highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      articleId TEXT NOT NULL,
      text TEXT NOT NULL,
      textHash TEXT NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create indexes for highlights queries
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_highlights_article
    ON highlights(articleId, createdAt DESC)
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_highlights_hash
    ON highlights(textHash)
  `);

  // Create insights table for Insight Capture & Share system
  database.exec(`
    CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      articleId TEXT NOT NULL,
      text TEXT NOT NULL,
      note TEXT,
      position TEXT NOT NULL,
      isPublic INTEGER NOT NULL DEFAULT 0,
      captureCount INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create indexes for insights queries
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_insights_user
    ON insights(userId, createdAt DESC)
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_insights_article
    ON insights(articleId, captureCount DESC)
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_insights_public
    ON insights(isPublic, captureCount DESC)
  `);

  // Create categories table for content organization
  database.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create article_categories junction table (many-to-many)
  database.exec(`
    CREATE TABLE IF NOT EXISTS article_categories (
      articleId TEXT NOT NULL,
      categoryId INTEGER NOT NULL,
      PRIMARY KEY (articleId, categoryId),
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for category queries
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_categories_slug
    ON categories(slug)
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_article_categories_category
    ON article_categories(categoryId)
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_article_categories_article
    ON article_categories(articleId)
  `);

  // Create resonances table for Resonance-First Bookmarking System
  database.exec(`
    CREATE TABLE IF NOT EXISTS resonances (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      articleId TEXT NOT NULL,
      resonanceNote TEXT NOT NULL,
      quote TEXT,
      vitality INTEGER NOT NULL DEFAULT 30,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived', 'considered')),
      visitCount INTEGER NOT NULL DEFAULT 0,
      lastVisitedAt INTEGER,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(userId, articleId)
    )
  `);

  // Create indexes for resonances queries
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_resonances_user
    ON resonances(userId, status, vitality)
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_resonances_articles
    ON resonances(articleId)
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_resonances_vitality
    ON resonances(vitality, status)
  `);

  // Create feedback table for Exit-Intent Feedback System
  database.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      reason TEXT NOT NULL,
      comment TEXT,
      timeOnPage INTEGER,
      scrollDepth REAL,
      userAgent TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create indexes for feedback queries
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_feedback_post
    ON feedback(postId, timestamp DESC)
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_feedback_reason
    ON feedback(reason, timestamp DESC)
  `);

  // TODO: Add indexes for better query performance on challenges table
  // TODO: Add articles table when needed
}
