import React, { useState } from "react";
import { MessageSquare, X, Clock } from "lucide-react";
import { UserComment } from "@/types/config.types";

interface CommentSectionProps {
  comments?: UserComment[];
  onAddComment: (text: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export function CommentSection({
  comments = [],
  onAddComment,
  onDeleteComment,
}: CommentSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isExpanded, setIsExpanded] = useState(comments.length > 0);

  const handleAdd = () => {
    if (commentText.trim()) {
      onAddComment(commentText.trim());
      setCommentText("");
      setIsAdding(false);
      setIsExpanded(true);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>
            Comments {comments.length > 0 && `(${comments.length})`}
          </span>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-50 dark:bg-gray-800/50 rounded p-2 group"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  {comment.text}
                </p>
                <button
                  onClick={() => onDeleteComment(comment.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all"
                  title="Delete comment"
                >
                  <X className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{formatTimestamp(comment.timestamp)}</span>
              </div>
            </div>
          ))}

          {isAdding && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add your comment... (e.g., why you changed this value)"
                className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
                rows={3}
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setCommentText("");
                  }}
                  className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!commentText.trim()}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Comment
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
