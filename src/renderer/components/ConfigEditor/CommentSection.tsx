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
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Comments {comments.length > 0 && `(${comments.length})`}</span>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-secondary/50 rounded-lg p-2 group">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-foreground flex-1">{comment.text}</p>
                <button
                  onClick={() => onDeleteComment(comment.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded-lg transition-all"
                  title="Delete comment"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{formatTimestamp(comment.timestamp)}</span>
              </div>
            </div>
          ))}

          {isAdding && (
            <div className="bg-secondary/50 rounded-lg p-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add your comment... (e.g., why you changed this value)"
                className="w-full px-2 py-1 text-sm bg-background border border-primary/20 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                rows={3}
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setCommentText("");
                  }}
                  className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!commentText.trim()}
                  className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
