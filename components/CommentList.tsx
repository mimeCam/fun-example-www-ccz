'use client';

import { useState, useEffect } from 'react';
import type { CommentWithReplies } from '@/types/comment';
import { CommentForm } from './CommentForm';

interface CommentListProps {
  articleId: string;
}

interface CommentItemProps {
  comment: CommentWithReplies;
  depth?: number;
  onReply?: (parentId: number) => void;
}

function CommentItem({ comment, depth = 0, onReply }: CommentItemProps) {
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [voteCount, setVoteCount] = useState(comment.upvotes - comment.downvotes);
  const [isVoting, setIsVoting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleVote = async (voteType: 'up' | 'down') => {
    if (isVoting) return;

    // In a real app, you'd get the user's email from authentication
    const userEmail = 'user@example.com'; // TODO: Replace with actual auth

    setIsVoting(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          voteType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      // Update local state
      if (userVote === voteType) {
        // Toggle off
        setUserVote(null);
        setVoteCount(prev => prev + (voteType === 'up' ? -1 : 1));
      } else {
        // Change vote
        const voteDiff = userVote ? 2 : 1; // If changing vote, effect is doubled
        setVoteCount(prev => prev + (voteType === 'up' ? voteDiff : -voteDiff));
        setUserVote(voteType);
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleReplySuccess = () => {
    setShowReplyForm(false);
    // In a real app, you'd refresh the comments list
    window.location.reload();
  };

  const isMaxDepth = depth >= 1; // Only allow 1 level of nesting

  return (
    <div className={`${depth > 0 ? 'ml-8 pl-4 border-l-2 border-gray-700' : ''}`}>
      <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
        <div className="flex items-start gap-3">
          {/* Vote buttons */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => handleVote('up')}
              disabled={isVoting}
              className={`p-1 rounded transition-colors ${
                userVote === 'up'
                  ? 'text-green-500'
                  : 'text-gray-400 hover:text-green-500'
              }`}
            >
              ▲
            </button>
            <span className="text-sm font-medium">{voteCount}</span>
            <button
              onClick={() => handleVote('down')}
              disabled={isVoting}
              className={`p-1 rounded transition-colors ${
                userVote === 'down'
                  ? 'text-red-500'
                  : 'text-gray-400 hover:text-red-500'
              }`}
            >
              ▼
            </button>
          </div>

          {/* Comment content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-primary">{comment.authorName}</span>
              <span className="text-gray-500 text-sm">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-300 whitespace-pre-wrap mb-3">{comment.content}</p>

            {/* Actions */}
            {!isMaxDepth && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-sm text-gray-400 hover:text-primary transition-colors"
              >
                {showReplyForm ? 'Cancel' : 'Reply'}
              </button>
            )}
          </div>
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-4">
            <CommentForm
              articleId={comment.articleId}
              parentId={comment.id}
              onSubmitSuccess={handleReplySuccess}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentList({ articleId }: CommentListProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/comments/article/${articleId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data: CommentWithReplies[] = await response.json();
      setComments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewComment = () => {
    fetchComments();
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Loading comments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load comments: {error}</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No comments yet. Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map(comment => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
