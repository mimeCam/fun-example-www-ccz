/**
 * Curiosity Trail Type Definitions
 * Author-curated semantic trails for content discovery
 */

/**
 * Connection types that describe relationships between articles
 */
export type TrailConnectionType =
  | 'foundational'     // Prerequisite knowledge
  | 'extension'        // Deeper dive into topic
  | 'practical'        // Application and exercises
  | 'alternative'      // Different perspective
  | 'related';         // Thematic connection

/**
 * A single connection between two articles in a trail
 */
export interface TrailConnection {
  /** Source article ID */
  fromArticleId: string;

  /** Target article ID */
  toArticleId: string;

  /** Type of relationship */
  connectionType: TrailConnectionType;

  /** Why this connection exists (author's reasoning) */
  reason: string;

  /** Optional: difficulty progression */
  difficultyLevel?: 1 | 2 | 3 | 4 | 5;
}

/**
 * A complete trail - a curated path through content
 */
export interface Trail {
  /** Unique trail identifier */
  id: string;

  /** Trail name/title */
  name: string;

  /** What readers will learn */
  description: string;

  /** Estimated completion time */
  estimatedTime: string;

  /** Ordered list of article IDs in the trail */
  articleIds: string[];

  /** Connections between articles */
  connections: TrailConnection[];

  /** Trail metadata */
  metadata: {
    /** Creation date */
    createdAt: string;

    /** Last updated */
    updatedAt: string;

    /** Trail category/topic */
    category: string;

    /** Difficulty level (1-5) */
    difficulty: 1 | 2 | 3 | 4 | 5;

    /** Author name */
    author: string;
  };
}

/**
 * Trail with article data populated
 */
export interface TrailWithArticles extends Trail {
  /** Full article data for each article in trail */
  articles: Array<{
    id: string;
    title: string;
    content: string;
    tags?: string[];
  }>;

  /** Current position in trail (if user is following) */
  currentPosition?: number;

  /** Completed articles (if user is following) */
  completedArticles?: Set<string>;
}

/**
 * Trail progress tracking
 */
export interface TrailProgress {
  /** Trail ID */
  trailId: string;

  /** User identifier (email fingerprint) */
  userId: string;

  /** Current position in trail */
  currentPosition: number;

  /** Completed article IDs */
  completedArticles: string[];

  /** Started timestamp */
  startedAt: string;

  /** Last accessed timestamp */
  lastAccessedAt: string;

  /** Completed timestamp (null if in progress) */
  completedAt?: string;
}

/**
 * Trail navigation state
 */
export interface TrailNavigation {
  /** Current trail */
  trail: TrailWithArticles;

  /** Current article index */
  currentIndex: number;

  /** Can go to previous article */
  canGoBack: boolean;

  /** Can go to next article */
  canGoForward: boolean;

  /** Progress percentage */
  progress: number;
}
