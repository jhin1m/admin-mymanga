"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Avatar from "@/components/ui/avatar/Avatar";
import Pagination from "@/components/ui/pagination/Pagination";
import { ConfirmModal } from "@/components/ui/modal/ConfirmModal";
import { ChapterReportDetailModal } from "@/components/ui/modal/ChapterReportDetailModal";
import { ChapterReport } from "@/services/api";
import { useChapterReports } from "@/context/ChapterReportsContext";

interface SearchFilters {
  report_type: string;
  user_id: string;
  sort: string;
}

interface ChapterReportsTableProps {
  searchFilters?: SearchFilters;
  onRefreshStats?: () => void;
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
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const ChapterReportsTable: React.FC<ChapterReportsTableProps> = ({
  searchFilters,
  onRefreshStats
}) => {
  const {
    reports,
    pagination,
    isLoadingReports,
    reportsError,
    fetchReports,
    deleteReport,
    bulkDeleteReports,
    refreshData
  } = useChapterReports();
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<ChapterReport | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Bulk delete modal states
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Detail modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ChapterReport | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchReports(1, searchFilters);
  }, [searchFilters, fetchReports]);

  const handlePageChange = (page: number) => {
    fetchReports(page, searchFilters);
  };

  const handleSelectReport = (reportId: string) => {
    setSelectedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedReports.size === reports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(reports.map(report => report.id)));
    }
  };

  const handleDeleteClick = (report: ChapterReport) => {
    setReportToDelete(report);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteReport(reportToDelete.id);
      setDeleteModalOpen(false);
      setReportToDelete(null);
      onRefreshStats?.();
    } catch (error) {
      console.error("Error deleting chapter report:", error);
      alert("Có lỗi xảy ra khi xóa báo cáo");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedReports.size === 0) return;
    setBulkDeleteModalOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedReports.size === 0) return;

    setBulkDeleteLoading(true);
    try {
      const reportIds = Array.from(selectedReports);
      await bulkDeleteReports(reportIds);
      setBulkDeleteModalOpen(false);
      setSelectedReports(new Set());
      onRefreshStats?.();
    } catch (error) {
      console.error("Error bulk deleting chapter reports:", error);
      alert("Có lỗi xảy ra khi xóa các báo cáo");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleViewDetail = async (report: typeof reports[0]) => {
    // Create a mapped report for the modal (using enriched data)
    const modalReport: ChapterReport = {
      ...report,
      user: report.enrichedUser ? {
        id: report.enrichedUser.id,
        name: report.enrichedUser.name,
        email: report.enrichedUser.email,
        avatar: report.enrichedUser.avatar
      } : undefined,
      manga: report.enrichedManga ? {
        id: report.enrichedManga.id,
        name: report.enrichedManga.name,
        cover: report.enrichedManga.cover
      } : undefined,
      chapter: report.enrichedChapter ? {
        id: report.enrichedChapter.id,
        name: report.enrichedChapter.name
      } : undefined
    };

    setSelectedReport(modalReport);
    setDetailModalOpen(true);
    setDetailLoading(false); // No need to fetch again since we have enriched data
  };

  const handleDetailDelete = async () => {
    if (!selectedReport) return;

    setDeleteLoading(true);
    try {
      await deleteReport(selectedReport.id);
      setDetailModalOpen(false);
      setSelectedReport(null);
      onRefreshStats?.();
    } catch (error) {
      console.error("Error deleting chapter report:", error);
      alert("Có lỗi xảy ra khi xóa báo cáo");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRefresh = async () => {
    await refreshData();
    onRefreshStats?.();
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              size="md"
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoadingReports}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </Button>

            {selectedReports.size > 0 && (
              <Button
                size="md"
                variant="outline"
                onClick={handleBulkDeleteClick}
                disabled={isLoadingReports}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                Xoá {selectedReports.size} báo cáo
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            Hiển thị {reports.length} / {pagination?.total || 0} báo cáo
          </div>
        </div>

        {isLoadingReports ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500 dark:text-gray-400">
              Đang tải dữ liệu...
            </div>
          </div>
        ) : reportsError ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-red-500 dark:text-red-400">
              {reportsError}
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-gray-500 dark:text-gray-400 mb-2">
                Không tìm thấy báo cáo nào
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
                <div className="min-w-[1000px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-12"
                        >
                          <input
                            type="checkbox"
                            checked={selectedReports.size === reports.length && reports.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                          />
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Loại lỗi
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Mô tả
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Người báo
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Manga
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Chapter
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Thời gian
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
                      {reports.map((report) => {
                        const badgeInfo = getReportTypeBadge(report.report_type);
                        return (
                          <TableRow key={report.id}>
                            <TableCell className="px-5 py-4 text-start">
                              <input
                                type="checkbox"
                                checked={selectedReports.has(report.id)}
                                onChange={() => handleSelectReport(report.id)}
                                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                              />
                            </TableCell>

                            <TableCell className="px-5 py-4 text-start">
                              <Badge
                                color={badgeInfo.color}
                                variant="light"
                                startIcon={badgeInfo.icon}
                                size="sm"
                              >
                                {report.report_type_label}
                              </Badge>
                            </TableCell>

                            <TableCell className="px-5 py-4 text-start max-w-xs">
                              <p className="text-theme-sm text-gray-800 dark:text-white/90 truncate">
                                {report.description || "Không có mô tả"}
                              </p>
                            </TableCell>

                            <TableCell className="px-4 py-3 text-start">
                              <div className="flex items-center gap-2">
                                <Avatar
                                  src={report.enrichedUser?.avatar || "/images/avatars/default.png"}
                                  alt={report.enrichedUser?.name || "Unknown"}
                                  size="small"
                                />
                                <div className="min-w-0">
                                  <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90 truncate">
                                    {report.enrichedUser?.name || "Unknown"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="px-4 py-3 text-start max-w-xs">
                              <div className="flex items-center gap-2">
                                {report.enrichedManga?.cover && (
                                  <img
                                    src={report.enrichedManga.cover}
                                    alt={report.enrichedManga.name}
                                    className="w-8 h-10 object-cover rounded"
                                  />
                                )}
                                <p className="text-theme-sm text-gray-800 dark:text-white/90 truncate">
                                  {report.enrichedManga?.name || "Unknown"}
                                </p>
                              </div>
                            </TableCell>

                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 max-w-xs">
                              <p className="truncate">
                                {report.enrichedChapter?.name || "Unknown"}
                              </p>
                            </TableCell>

                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              {formatDate(report.created_at)}
                            </TableCell>

                            <TableCell className="px-4 py-3 text-start">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetail(report)}
                                  className="text-xs"
                                >
                                  👁️ Xem
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`/admin/chapters/${report.chapter_id}/edit`, '_blank')}
                                  className="text-xs text-blue-600 hover:text-blue-700 hover:border-blue-300"
                                >
                                  ✏️ Sửa
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteClick(report)}
                                  className="text-xs text-red-600 hover:text-red-700 hover:border-red-300"
                                >
                                  🗑️ Xóa
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <Pagination
              currentPage={pagination?.currentPage || 1}
              totalPages={pagination?.totalPages || 1}
              total={pagination?.total || 0}
              perPage={pagination?.perPage || 20}
              onPageChange={handlePageChange}
              loading={isLoadingReports}
            />
          </>
        )}
      </div>

      {/* Single Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setReportToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa báo cáo"
        message={`Bạn có chắc chắn muốn xóa báo cáo này?\nHành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Xác nhận xóa nhiều báo cáo"
        message={`Bạn có chắc chắn muốn xóa ${selectedReports.size} báo cáo đã chọn?\nHành động này không thể hoàn tác.`}
        confirmText="Xóa tất cả"
        cancelText="Hủy"
        confirmVariant="danger"
        isLoading={bulkDeleteLoading}
      />

      {/* Detail Modal */}
      <ChapterReportDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedReport(null);
        }}
        onDelete={handleDetailDelete}
        report={selectedReport}
        isLoading={detailLoading}
        deleteLoading={deleteLoading}
      />
    </>
  );
};

export default ChapterReportsTable;