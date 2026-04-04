// Challenge feature types
// TODO: Add more types as needed for the challenge system

export interface Challenge {
  id: number;
  articleId: string;
  authorName: string;
  authorEmail: string;
  challengeText: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateChallengeInput {
  articleId: string;
  authorName: string;
  authorEmail: string;
  challengeText: string;
}

// TODO: Add response types for API calls
