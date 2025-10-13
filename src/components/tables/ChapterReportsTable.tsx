"use client";
import React, { useState, useEffect, useCallback } from "react";
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
import { apiService, ChapterReport, ChapterReportManga, ChapterReportChapter } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface ApiUserResponse {
  id: string;
  name: string;
  email?: string;
  avatar_full_url?: string;
}

interface PaginationData {
  count: number;
  total: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
}

interface SearchFilters {
  report_type: string;
  user_id: string;
  sort: string;
}

interface ChapterReportsApiResponse {
  success: boolean;
  data: ChapterReport[];
  pagination?: {
    count: number;
    total: number;
    perPage: number;
    currentPage: number;
    totalPages: number;
  };
  message?: string;
  code: number;
}

interface EnrichedChapterReport extends ChapterReport {
  enrichedUser?: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  enrichedManga?: {
    id: string;
    name: string;
    cover?: string;
  };
  enrichedChapter?: {
    id: string;
    name: string;
  };
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
  const { token } = useAuth();
  const [reports, setReports] = useState<EnrichedChapterReport[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    count: 0,
    total: 0,
    perPage: 20,
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
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

  const enrichReportData = useCallback(async (report: ChapterReport): Promise<EnrichedChapterReport> => {
    if (!token) return report as EnrichedChapterReport;

    const enriched: EnrichedChapterReport = { ...report };

    try {
      // Fetch user data
      const userResponse = await apiService.getUsers(token, {
        filters: { id: report.user_id },
        per_page: 1
      });
      if (userResponse.success && userResponse.data && Array.isArray(userResponse.data) && userResponse.data.length > 0) {
        const userData = userResponse.data[0] as ApiUserResponse;
        enriched.enrichedUser = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar_full_url
        };
      }

      // Fetch manga data
      const mangaResponse = await apiService.getMangaById(token, report.manga_id);
      if (mangaResponse.success && mangaResponse.data) {
        const mangaData = mangaResponse.data as ChapterReportManga;
        enriched.enrichedManga = {
          id: mangaData.id,
          name: mangaData.name,
          cover: mangaData.cover
        };
      }

      // Fetch chapter data
      const chapterResponse = await apiService.getChapters(token, {
        filters: { manga_id: report.manga_id },
        per_page: 999999,
        sort: "-order"
      });
      if (chapterResponse.success && chapterResponse.data && Array.isArray(chapterResponse.data)) {
        const chapters = chapterResponse.data as ChapterReportChapter[];
        const chapter = chapters.find((ch: ChapterReportChapter) => ch.id === report.chapter_id);
        if (chapter) {
          enriched.enrichedChapter = {
            id: chapter.id,
            name: chapter.name
          };
        }
      }
    } catch (error) {
      console.error("Error enriching report data:", error);
    }

    return enriched;
  }, [token]);

  const fetchReports = useCallback(
    async (page = 1, filters?: Partial<SearchFilters>) => {
      if (!token) return;

      setLoading(true);
      try {
        const params: Record<string, unknown> = {
          page: page,
          per_page: pagination.perPage,
          sort: filters?.sort || "-created_at",
        };

        // Prepare filters object for API
        if (filters) {
          const apiFilters: Record<string, string> = {};

          if (filters.report_type && filters.report_type.trim()) {
            apiFilters.report_type = filters.report_type.trim();
          }

          if (filters.user_id && filters.user_id.trim()) {
            apiFilters.user_id = filters.user_id.trim();
          }

          if (Object.keys(apiFilters).length > 0) {
            params.filters = apiFilters;
          }
        }

        const response = await apiService.getChapterReports(token, params) as ChapterReportsApiResponse;

        if (response.success && response.data) {
          // Enrich each report with additional data
          const enrichedReports = await Promise.all(
            response.data.map(report => enrichReportData(report))
          );

          setReports(enrichedReports);

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
        console.error("Error fetching chapter reports:", error);
      } finally {
        setLoading(false);
      }
    },
    [token, pagination.perPage, enrichReportData]
  );

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
    if (!token || !reportToDelete) return;

    setDeleteLoading(true);
    try {
      await apiService.deleteChapterReport(token, reportToDelete.id);
      setDeleteModalOpen(false);
      setReportToDelete(null);
      await fetchReports(pagination.currentPage, searchFilters);
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
    if (!token || selectedReports.size === 0) return;

    setBulkDeleteLoading(true);
    try {
      const reportIds = Array.from(selectedReports);
      await apiService.bulkDeleteChapterReports(token, reportIds);
      setBulkDeleteModalOpen(false);
      setSelectedReports(new Set());
      await fetchReports(pagination.currentPage, searchFilters);
      onRefreshStats?.();
    } catch (error) {
      console.error("Error bulk deleting chapter reports:", error);
      alert("Có lỗi xảy ra khi xóa các báo cáo");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleViewDetail = async (report: EnrichedChapterReport) => {
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
    if (!token || !selectedReport) return;

    setDeleteLoading(true);
    try {
      await apiService.deleteChapterReport(token, selectedReport.id);
      setDetailModalOpen(false);
      setSelectedReport(null);
      await fetchReports(pagination.currentPage, searchFilters);
      onRefreshStats?.();
    } catch (error) {
      console.error("Error deleting chapter report:", error);
      alert("Có lỗi xảy ra khi xóa báo cáo");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchReports(pagination.currentPage, searchFilters);
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
              disabled={loading}
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
                disabled={loading}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                Xoá {selectedReports.size} báo cáo
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            Hiển thị {reports.length} / {pagination.total} báo cáo
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500 dark:text-gray-400">
              Đang tải dữ liệu...
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