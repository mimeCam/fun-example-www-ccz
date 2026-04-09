// Challenge feature types

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

