// Insight Capture & Share feature types
// Personal insight capture with sharing and social proof

export interface Insight {
  id: string;
  userId: string; // Email fingerprint for privacy
  articleId: string;
  text: string; // The highlighted passage
  note?: string; // User's optional reflection
  position: {
    startOffset: number;
    endOffset: number;
  };
  isPublic: boolean; // Allow sharing
  captureCount: number; // Times this insight has been captured
  createdAt: string;
  updatedAt: string;
}

export interface CreateInsightInput {
  articleId: string;
  text: string;
  note?: string;
  position: {
    startOffset: number;
    endOffset: number;
  };
  isPublic?: boolean;
}

export interface InsightStats {
  insightId: string;
  captureCount: number;
  articleId: string;
}

