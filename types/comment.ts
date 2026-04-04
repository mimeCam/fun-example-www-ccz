export interface Comment {
  id: number;
  articleId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  parentId: number | null;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentUpvote {
  id: number;
  commentId: number;
  userEmail: string;
  voteType: 'up' | 'down';
  createdAt: string;
}

export interface CreateCommentInput {
  articleId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  parentId?: number;
}

export interface CreateCommentUpvoteInput {
  commentId: number;
  userEmail: string;
  voteType: 'up' | 'down';
}

export interface CommentWithReplies extends Comment {
  replies?: Comment[];
}
