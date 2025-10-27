"use client";
import React from "react";
import { Modal } from "./index";
import Button from "../button/Button";
import Badge from "../badge/Badge";
import { ChapterReport } from "@/services/api";

interface ChapterReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
  report: ChapterReport | null;
  isLoading?: boolean;
  deleteLoading?: boolean;
}

const getReportTypeBadge = (reportType: string) => {
  switch (reportType) {
    case 'broken_images':
      return { color: 'error' as const, icon: '🖼️' };
    case 'missing_images':
      return { color: 'warning' as const, icon: '📷' };
    case 'wrong_order':
      return { color: 'info' as const, icon: '🔀' };
    case 'wrong_chapter':
      return { color: 'warning' as const, icon: '📖' };
    case 'duplicate':
      return { color: 'error' as const, icon: '📋' };
    case 'other':
    default:
      return { color: 'light' as const, icon: '❓' };
  }
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

export const ChapterReportDetailModal: React.FC<ChapterReportDetailModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  report,
  isLoading = false,
  deleteLoading = false,
}) => {
  if (!report) {
    return null;
  }

  const badgeInfo = getReportTypeBadge(report.report_type);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 dark:text-white text-xl">
            Chi tiết báo lỗi Chapter
          </h4>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500"></div>
              Đang tải thông tin...
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Loại lỗi
              </label>
              <div className="flex items-center gap-2">
                <Badge color={badgeInfo.color} variant="light" startIcon={badgeInfo.icon}>
                  {report.report_type_label}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mô tả lỗi
              </label>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {report.description || "Không có mô tả"}
                </p>
              </div>
            </div>

            {/* User Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Người báo lỗi
              </label>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="font-medium text-gray-900 dark:text-white">
                  {report.user?.name || `User ID: ${report.user_id}`}
                </p>
                {report.user?.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {report.user.email}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  ID: {report.user_id}
                </p>
              </div>
            </div>

            {/* Manga & Chapter Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Manga
                </label>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {report.manga?.name || `Manga ID: ${report.manga_id}`}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    ID: {report.manga_id}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chapter
                </label>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {report.chapter?.name || `Chapter ID: ${report.chapter_id}`}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    ID: {report.chapter_id}
                  </p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thời gian tạo
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(report.created_at)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cập nhật lần cuối
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(report.updated_at)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={deleteLoading}
          >
            Đóng
          </Button>
        </div>

        {onDelete && (
          <Button
            size="sm"
            onClick={onDelete}
            disabled={deleteLoading || isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Đang xoá...
              </span>
            ) : (
              "Xoá báo cáo"
            )}
          </Button>
        )}
      </div>
    </Modal>
  );
};