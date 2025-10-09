"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/ui/pagination/Pagination";
import { ConfirmModal } from "@/components/ui/modal/ConfirmModal";
import {
  CommentFormModal,
  CommentFormData,
} from "@/components/ui/modal/CommentFormModal";
import { CommentThreadModal } from "@/components/ui/modal/CommentThreadModal";
import { apiService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { EyeIcon, PencilIcon, TrashBinIcon } from "@/icons";

interface User {
  id: string;
  name: string;
  avatar_full_url?: string | null;
}

interface Commentable {
  id: string;
  name: string;
}

interface Comment {
  id: string;
  content: string;
  commentable_id: string;
  commentable_type: string;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
  commentable?: Commentable;
}

interface PaginationData {
  count: number;
  total: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
}

interface SearchFilters {
  username: string;
  created_at_start: string;
  created_at_end: string;
}

interface CommentsTableProps {
  searchFilters?: SearchFilters;
}

const CommentsTable: React.FC<CommentsTableProps> = ({ searchFilters }) => {
  const { token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    count: 0,
    total: 0,
    perPage: 50,
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [commentToEdit, setCommentToEdit] = useState<Comment | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Thread modal states
  const [threadModalOpen, setThreadModalOpen] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

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

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const fetchComments = useCallback(
    async (page = 1, filters?: Partial<SearchFilters>) => {
      if (!token) return;

      setLoading(true);
      try {
        const params: Record<string, any> = {
          page: page,
          per_page: pagination.perPage,
          sort: "-created_at",
          include: "commentable,user",
        };

        // Prepare filters object for API
        if (filters) {
          const apiFilters: Record<string, string> = {};

          if (filters.username && filters.username.trim()) {
            apiFilters.username = filters.username.trim();
          }

          if (filters.created_at_start && filters.created_at_start.trim()) {
            apiFilters.created_at_start = filters.created_at_start.trim();
          }

          if (filters.created_at_end && filters.created_at_end.trim()) {
            apiFilters.created_at_end = filters.created_at_end.trim();
          }

          if (Object.keys(apiFilters).length > 0) {
            params.filters = apiFilters;
          }
        }

        const response = await apiService.getComments(token, params);

        if (response.success && response.data) {
          setComments(response.data);
          if (response.pagination) {
            setPagination({
              count: response.pagination.count,
              total: response.pagination.total,
              perPage: response.pagination.perPage,
              currentPage: response.pagination.currentPage,
              totalPages: response.pagination.totalPages,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoading(false);
      }
    },
    [token, pagination.perPage]
  );

  useEffect(() => {
    fetchComments(1, searchFilters);
  }, [searchFilters]);

  const handlePageChange = (page: number) => {
    fetchComments(page, searchFilters);
  };

  const handleDeleteClick = (comment: Comment) => {
    setCommentToDelete(comment);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!token || !commentToDelete) return;

    setDeleteLoading(true);
    try {
      await apiService.deleteComment(token, commentToDelete.id);
      setDeleteModalOpen(false);
      setCommentToDelete(null);
      // Refresh the list after deletion
      await fetchComments(pagination.currentPage, searchFilters);
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Có lỗi xảy ra khi xóa comment");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditClick = (comment: Comment) => {
    setCommentToEdit(comment);
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (data: CommentFormData) => {
    if (!token || !commentToEdit) return;

    setFormLoading(true);
    try {
      await apiService.updateComment(token, commentToEdit.id, data);
      setFormModalOpen(false);
      setCommentToEdit(null);
      // Refresh the list after update
      await fetchComments(pagination.currentPage, searchFilters);
    } catch (error: any) {
      console.error("Error updating comment:", error);
      const errorMessage =
        error?.message || "Có lỗi xảy ra khi cập nhật comment";
      alert(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewThread = (commentId: string) => {
    setSelectedCommentId(commentId);
    setThreadModalOpen(true);
  };

  const handleThreadUpdate = async () => {
    // Refresh the list when thread is updated
    await fetchComments(pagination.currentPage, searchFilters);
  };

  const getCommentableDisplayName = (comment: Comment) => {
    if (comment.commentable?.name) {
      return comment.commentable.name;
    }
    return "N/A";
  };

  const getCommentableType = (type: string) => {
    if (type === "App\\Models\\Manga") return "Manga";
    if (type === "App\\Models\\Chapter") return "Chapter";
    return type;
  };

  return (
    <>
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500 dark:text-gray-400">
              Đang tải dữ liệu...
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-gray-500 dark:text-gray-400 mb-2">
                Không tìm thấy comment nào
              </div>
              <div className="text-sm text-gray-400 dark:text-gray-500">
                Thử thay đổi điều kiện tìm kiếm hoặc xóa bộ lọc
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[1200px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Avatar
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Tạo bởi
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Nội dung
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Liên kết
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Tạo lúc
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Hành động
                        </TableCell>
                      </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {comments.map((comment) => (
                        <TableRow key={comment.id}>
                          <TableCell className="px-5 py-4 text-start">
                            <div className="flex items-center">
                              {comment.user?.avatar_full_url ? (
                                <img
                                  src={comment.user.avatar_full_url}
                                  alt={comment.user.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                    {comment.user?.name?.charAt(0).toUpperCase() || "?"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="px-5 py-4 text-start">
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {comment.user?.name || "N/A"}
                            </span>
                          </TableCell>

                          <TableCell className="px-5 py-4 text-start">
                            <span className="block text-gray-600 text-theme-sm dark:text-gray-400 line-clamp-3">
                              {stripHtml(comment.content)}
                            </span>
                          </TableCell>

                          <TableCell className="px-5 py-4 text-start">
                            <div>
                              <span className="block text-xs text-gray-500 dark:text-gray-500">
                                {getCommentableType(comment.commentable_type)}
                              </span>
                              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {getCommentableDisplayName(comment)}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {formatDate(comment.created_at)}
                          </TableCell>

                          <TableCell className="px-4 py-3 text-start">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewThread(comment.id)}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400"
                                title="Xem"
                              >
                                <EyeIcon className="w-5 h-5" />
                              </button>

                              <button
                                onClick={() => handleEditClick(comment)}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-yellow-200 bg-yellow-50 text-yellow-600 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400"
                                title="Sửa"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>

                              <button
                                onClick={() => handleDeleteClick(comment)}
                                className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                                title="Xóa"
                              >
                                <TrashBinIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              total={pagination.total}
              perPage={pagination.perPage}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCommentToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa comment này?\nHành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />

      <CommentFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setCommentToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={
          commentToEdit
            ? {
                content: commentToEdit.content,
                commentable_type: commentToEdit.commentable_type,
                commentable_id: commentToEdit.commentable_id,
                parent_id: commentToEdit.parent_id || "",
              }
            : undefined
        }
        isLoading={formLoading}
      />

      <CommentThreadModal
        isOpen={threadModalOpen}
        onClose={() => {
          setThreadModalOpen(false);
          setSelectedCommentId(null);
        }}
        commentId={selectedCommentId || ""}
        onThreadUpdate={handleThreadUpdate}
      />
    </>
  );
};

export default CommentsTable;
