"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "./index";
import Button from "../button/Button";
import Badge from "../badge/Badge";
import TextArea from "@/components/form/input/TextArea";
import { apiService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface User {
  id: string;
  name: string;
  avatar_full_url?: string | null;
}

interface Commentable {
  id: string;
  name: string;
}

interface Reply {
  id: string;
  content: string;
  commentable_id: string;
  commentable_type: string;
  parent_id: string | null;
  created_at: string;
  user_id?: string;
  user?: User;
  childes?: Reply[];
}

interface CommentThread {
  id: string;
  content: string;
  commentable_id: string;
  commentable_type: string;
  parent_id: string | null;
  created_at: string;
  user_id?: string;
  user?: User;
  commentable?: Commentable;
  childes?: Reply[];
}

interface CommentThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  commentId: string;
  onThreadUpdate?: () => void;
}

export const CommentThreadModal: React.FC<CommentThreadModalProps> = ({
  isOpen,
  onClose,
  commentId,
  onThreadUpdate,
}) => {
  const { token, user } = useAuth();
  const [thread, setThread] = useState<CommentThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    if (isOpen && commentId && token) {
      fetchThread();
    }
  }, [isOpen, commentId, token]);

  const fetchThread = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getCommentThread(token, commentId);
      if (response.success && response.data) {
        setThread(response.data);
      } else {
        setError("Không thể tải bình luận");
      }
    } catch (err: any) {
      console.error("Error fetching comment thread:", err);
      setError(err?.message || "Có lỗi xảy ra khi tải bình luận");
    } finally {
      setLoading(false);
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getCommentableType = (type: string) => {
    if (type === "App\\Models\\Manga") return "Manga";
    if (type === "App\\Models\\Chapter") return "Chapter";
    return type;
  };

  const handleReplyClick = (commentId: string) => {
    if (activeReplyId === commentId) {
      setActiveReplyId(null);
      setReplyContent("");
    } else {
      setActiveReplyId(commentId);
      setReplyContent("");
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!token || !thread || !replyContent.trim() || !user) return;

    setReplyLoading(true);
    try {
      await apiService.createCommentReply(token, {
        content: replyContent.trim(),
        parent_id: parentId,
        commentable_id: thread.commentable_id,
        commentable_type: thread.commentable_type,
        user_id: user.id,
      });

      // Reset form
      setReplyContent("");
      setActiveReplyId(null);

      // Refetch thread
      await fetchThread();

      // Notify parent component
      onThreadUpdate?.();
    } catch (err: any) {
      console.error("Error creating reply:", err);
      alert(err?.message || "Có lỗi xảy ra khi gửi trả lời");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDeleteComment = async (deleteCommentId: string) => {
    if (!token) return;

    if (!confirm("Bạn có chắc chắn muốn xóa comment này?")) {
      return;
    }

    try {
      await apiService.deleteComment(token, deleteCommentId);

      // If deleting root comment, close modal
      if (deleteCommentId === commentId) {
        onClose();
        onThreadUpdate?.();
      } else {
        // Otherwise refetch thread
        await fetchThread();
        onThreadUpdate?.();
      }
    } catch (err: any) {
      console.error("Error deleting comment:", err);
      alert(err?.message || "Có lỗi xảy ra khi xóa comment");
    }
  };

  const renderAvatar = (user?: User, userId?: string) => {
    if (user?.avatar_full_url) {
      return (
        <img
          src={user.avatar_full_url}
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }

    // Fallback: use first letter of name, or first letter of userId, or "?"
    const initial = user?.name?.charAt(0).toUpperCase()
      || userId?.charAt(0).toUpperCase()
      || "?";

    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          {initial}
        </span>
      </div>
    );
  };

  const renderReplyForm = (parentId: string) => {
    if (activeReplyId !== parentId) return null;

    return (
      <div className="mt-4 ml-12 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <TextArea
          placeholder="Nhập nội dung trả lời..."
          rows={3}
          value={replyContent}
          onChange={setReplyContent}
          disabled={replyLoading}
        />
        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleReplySubmit(parentId)}
            disabled={replyLoading || !replyContent.trim()}
          >
            {replyLoading ? "Đang gửi..." : "Gửi"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setActiveReplyId(null);
              setReplyContent("");
            }}
            disabled={replyLoading}
          >
            Hủy
          </Button>
        </div>
      </div>
    );
  };

  const renderCommentNode = (comment: Reply, depth: number = 0) => {
    const marginLeft = depth > 0 ? `ml-6` : "";
    const borderLeft = depth > 0 ? "border-l-2 border-gray-200 dark:border-gray-700 pl-4" : "";

    // Fallback name if user object is missing
    const displayName = comment.user?.name
      || (comment.user_id ? `User ${comment.user_id.substring(0, 8)}` : "Người dùng ẩn danh");

    return (
      <div key={comment.id} className={`${marginLeft} ${borderLeft} mb-4`}>
        <div className="flex items-start gap-3">
          {renderAvatar(comment.user, comment.user_id)}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800 dark:text-white/90 text-sm">
                {displayName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(comment.created_at)}
              </span>
            </div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {stripHtml(comment.content)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReplyClick(comment.id)}
                className="text-xs"
              >
                Trả lời
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteComment(comment.id)}
                className="text-xs text-red-600 hover:text-red-700 hover:border-red-300"
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>

        {renderReplyForm(comment.id)}

        {comment.childes && comment.childes.length > 0 && (
          <div className="mt-4">
            {comment.childes.map((reply) => renderCommentNode(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[800px] p-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white text-xl">
          Chi tiết bình luận
        </h4>
      </div>

      {/* Content */}
      <div className="max-h-[70vh] overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              Đang tải dữ liệu...
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-600 dark:text-red-400 mb-2">{error}</div>
              <Button size="sm" variant="outline" onClick={fetchThread}>
                Thử lại
              </Button>
            </div>
          </div>
        ) : thread ? (
          <div className="space-y-6">
            {/* Root Comment */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                {renderAvatar(thread.user, thread.user_id)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {thread.user?.name || "Người dùng"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(thread.created_at)}
                    </span>
                    <Badge
                      variant="light"
                      color="primary"
                      size="sm"
                    >
                      {getCommentableType(thread.commentable_type)}
                    </Badge>
                    {thread.commentable && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        → {thread.commentable.name}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-gray-700 dark:text-gray-200">
                    {stripHtml(thread.content)}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleReplyClick(thread.id)}
                      className="text-xs"
                    >
                      Trả lời
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteComment(thread.id)}
                      className="text-xs text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>

              {renderReplyForm(thread.id)}
            </div>

            {/* Separator */}
            {thread.childes && thread.childes.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700"></div>
            )}

            {/* Replies */}
            {thread.childes && thread.childes.length > 0 && (
              <div className="space-y-4">
                <h5 className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                  Trả lời ({thread.childes.length})
                </h5>
                {thread.childes.map((reply) => renderCommentNode(reply, 0))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <Button size="md" variant="outline" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Modal>
  );
};
