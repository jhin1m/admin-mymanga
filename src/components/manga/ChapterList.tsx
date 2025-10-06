"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import { ConfirmModal } from "@/components/ui/modal/ConfirmModal";
import { useModal } from "@/hooks/useModal";
import { Alert } from "@/components/ui/alert/Alert";

interface Chapter {
  id: string;
  manga_id: string;
  name: string;
  order: number;
  created_at: string;
  updated_at: string;
}

interface ChapterListProps {
  mangaId: string;
  onRefresh?: () => void;
}

const ChapterList: React.FC<ChapterListProps> = ({ mangaId, onRefresh }) => {
  const { token } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Modals and alerts
  const deleteModal = useModal();
  const bulkDeleteModal = useModal();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchChapters = async () => {
    if (!token || !mangaId) return;

    setLoading(true);
    try {
      const response = await apiService.getChapters(token, {
        filters: { manga_id: mangaId },
        per_page: 999999,
        sort: '-order',
      });

      if (response.success && response.data) {
        setChapters(response.data);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, [token, mangaId]);

  const handleSelectAll = () => {
    if (selectedChapters.length === chapters.length) {
      setSelectedChapters([]);
    } else {
      setSelectedChapters(chapters.map(c => c.id));
    }
  };

  const handleSelectChapter = (chapterId: string) => {
    if (selectedChapters.includes(chapterId)) {
      setSelectedChapters(selectedChapters.filter(id => id !== chapterId));
    } else {
      setSelectedChapters([...selectedChapters, chapterId]);
    }
  };

  const handleDeleteClick = (chapterId: string, chapterName: string) => {
    setDeleteTarget({ id: chapterId, name: chapterName });
    deleteModal.openModal();
  };

  const handleDeleteConfirm = async () => {
    if (!token || !deleteTarget) return;

    setActionLoading(prev => ({ ...prev, [deleteTarget.id]: true }));

    try {
      await apiService.deleteChapter(token, deleteTarget.id);
      await fetchChapters();
      if (onRefresh) onRefresh();
      setAlert({ type: "success", message: "Đã xóa chương thành công" });
      deleteModal.closeModal();
    } catch (error) {
      console.error("Error deleting chapter:", error);
      setAlert({ type: "error", message: "Có lỗi xảy ra khi xóa chương" });
    } finally {
      setActionLoading(prev => ({ ...prev, [deleteTarget.id]: false }));
      setDeleteTarget(null);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (!token || selectedChapters.length === 0) return;

    setBulkDeleting(true);

    try {
      const count = selectedChapters.length;
      await apiService.deleteManyChapters(token, selectedChapters);
      setSelectedChapters([]);
      await fetchChapters();
      if (onRefresh) onRefresh();
      setAlert({ type: "success", message: `Đã xóa ${count} chương thành công` });
      bulkDeleteModal.closeModal();
    } catch (error) {
      console.error("Error deleting chapters:", error);
      setAlert({ type: "error", message: "Có lỗi xảy ra khi xóa các chương" });
    } finally {
      setBulkDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alert notifications */}
      {alert && (
        <Alert
          type={alert.type}
          title={alert.type === "success" ? "Thành công" : "Lỗi"}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Header actions */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Tổng số: <span className="font-medium">{chapters.length}</span> chương
        </div>
        <Link
          href={`/admin/chapters/new?manga_id=${mangaId}`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo mới
        </Link>
      </div>

      {/* Table */}
      {chapters.length > 0 ? (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedChapters.length === chapters.length && chapters.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-brand-500 focus:ring-brand-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tên chương
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Thứ tự
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cập nhật
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {chapters.map((chapter) => (
                <tr
                  key={chapter.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedChapters.includes(chapter.id)}
                      onChange={() => handleSelectChapter(chapter.id)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-brand-500 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {chapter.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    #{chapter.order}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(chapter.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/chapters/${chapter.id}/edit`}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-brand-700 bg-brand-50 rounded hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/30 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(chapter.id, chapter.name)}
                        disabled={actionLoading[chapter.id]}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-red-700 bg-red-50 rounded hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                        title="Xóa"
                      >
                        {actionLoading[chapter.id] ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-700 border-t-transparent"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-lg">Chưa có chương nào</p>
          <p className="text-sm mt-1">Nhấn "Tạo mới" để thêm chương đầu tiên</p>
        </div>
      )}

      {/* Bulk actions */}
      {selectedChapters.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
          <div className="text-sm text-brand-700 dark:text-brand-300">
            Đã chọn <span className="font-medium">{selectedChapters.length}</span> chương
          </div>
          <button
            onClick={bulkDeleteModal.openModal}
            disabled={bulkDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkDeleting ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Đang xóa...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Xóa đã chọn
              </>
            )}
          </button>
        </div>
      )}

      {/* Delete single chapter modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa chương"
        message={`Bạn có chắc chắn muốn xóa chương "${deleteTarget?.name}"?\n\nHành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="danger"
        isLoading={deleteTarget ? actionLoading[deleteTarget.id] : false}
      />

      {/* Delete multiple chapters modal */}
      <ConfirmModal
        isOpen={bulkDeleteModal.isOpen}
        onClose={bulkDeleteModal.closeModal}
        onConfirm={handleBulkDeleteConfirm}
        title="Xác nhận xóa nhiều chương"
        message={`Bạn có chắc chắn muốn xóa ${selectedChapters.length} chương đã chọn?\n\nHành động này không thể hoàn tác.`}
        confirmText="Xóa tất cả"
        cancelText="Hủy"
        confirmVariant="danger"
        isLoading={bulkDeleting}
      />
    </div>
  );
};

export default ChapterList;
