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
import Pagination from "@/components/ui/pagination/Pagination";
import { ConfirmModal } from "@/components/ui/modal/ConfirmModal";
import { AchievementFormModal } from "@/components/ui/modal/AchievementFormModal";
import { apiService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface Achievement {
  id: string;
  name: string;
  font_family: string;
  font_size: string;
  color: string;
  weight: string;
  font_style: string;
  text_shadow: string;
  required_points: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
  };
}

interface PaginationData {
  count: number;
  total: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
}

interface SearchFilters {
  name: string;
}

interface AchievementsApiResponse {
  success: boolean;
  data: Achievement[];
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

interface AchievementsTableProps {
  searchFilters?: SearchFilters;
}

const AchievementsTable: React.FC<AchievementsTableProps> = ({ searchFilters }) => {
  const { token } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    count: 0,
    total: 0,
    perPage: 50,
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [achievementToDelete, setAchievementToDelete] = useState<Achievement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [achievementToEdit, setAchievementToEdit] = useState<Achievement | null>(null);
  const [formLoading, setFormLoading] = useState(false);

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

  const fetchAchievements = useCallback(
    async (page = 1, filters?: Partial<SearchFilters>) => {
      if (!token) return;

      setLoading(true);
      try {
        const params: Record<string, unknown> = {
          page: page,
          per_page: pagination.perPage,
          sort: "-created_at",
          include: "user",
        };

        // Prepare filters object for API
        if (filters) {
          const apiFilters: Record<string, string> = {};

          if (filters.name && filters.name.trim()) {
            apiFilters.name = filters.name.trim();
          }

          if (Object.keys(apiFilters).length > 0) {
            params.filters = apiFilters;
          }
        }

        const response = await apiService.getAchievements(token, params) as AchievementsApiResponse;

        if (response.success && response.data) {
          setAchievements(response.data);
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
        console.error("Error fetching achievements:", error);
      } finally {
        setLoading(false);
      }
    },
    [token, pagination.perPage]
  );

  useEffect(() => {
    fetchAchievements(1, searchFilters);
  }, [searchFilters, fetchAchievements]);

  const handlePageChange = (page: number) => {
    fetchAchievements(page, searchFilters);
  };

  const handleDeleteClick = (achievement: Achievement) => {
    setAchievementToDelete(achievement);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!token || !achievementToDelete) return;

    setDeleteLoading(true);
    try {
      await apiService.deleteAchievement(token, achievementToDelete.id);
      setDeleteModalOpen(false);
      setAchievementToDelete(null);
      // Refresh the list after deletion
      await fetchAchievements(pagination.currentPage, searchFilters);
    } catch (error) {
      console.error("Error deleting achievement:", error);
      alert("Có lỗi xảy ra khi xóa danh hiệu");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditClick = (achievementId: string) => {
    const achievement = achievements.find((a) => a.id === achievementId);
    if (!achievement) return;

    setAchievementToEdit(achievement);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleCreateNew = () => {
    setAchievementToEdit(null);
    setFormMode("create");
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (data: {
    name: string;
    font_family: string;
    font_size: string;
    color: string;
    weight: string;
    font_style: string;
    text_shadow: string;
    required_points: number;
  }) => {
    if (!token) return;

    setFormLoading(true);
    try {
      if (formMode === "create") {
        await apiService.createAchievement(token, data);
      } else if (formMode === "edit" && achievementToEdit) {
        await apiService.updateAchievement(token, achievementToEdit.id, data);
      }

      setFormModalOpen(false);
      setAchievementToEdit(null);
      // Refresh the list after create/update
      await fetchAchievements(pagination.currentPage, searchFilters);
    } catch (error: unknown) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Có lỗi xảy ra khi thực hiện hành động này";
      alert(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const getPreviewStyle = (achievement: Achievement) => ({
    fontFamily: achievement.font_family,
    fontSize: `${achievement.font_size}px`,
    color: achievement.color,
    fontWeight: achievement.weight,
    fontStyle: achievement.font_style,
    textShadow: achievement.text_shadow === "unset" ? "none" : achievement.text_shadow,
  });

  return (
    <>
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500 dark:text-gray-400">
              Đang tải dữ liệu...
            </div>
          </div>
        ) : achievements.length === 0 ? (
          <>
            <div className="flex items-center justify-end">
              <Button size="md" variant="primary" onClick={handleCreateNew}>
                Tạo mới
              </Button>
            </div>
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  Không tìm thấy danh hiệu nào
                </div>
                <div className="text-sm text-gray-400 dark:text-gray-500">
                  Thử thay đổi điều kiện tìm kiếm hoặc xóa bộ lọc
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-end">
              <Button size="md" variant="primary" onClick={handleCreateNew}>
                Tạo mới
              </Button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <div className="min-w-[1000px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          ID
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Preview
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
                          Điểm
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
                      {achievements.map((achievement) => (
                        <TableRow key={achievement.id}>
                          <TableCell className="px-5 py-4 text-start">
                            <span className="text-theme-sm font-mono text-gray-600 dark:text-gray-400">
                              {achievement.id.substring(0, 8)}...
                            </span>
                          </TableCell>

                          <TableCell className="px-5 py-4 text-start">
                            <span style={getPreviewStyle(achievement)}>
                              {achievement.name}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {achievement.user?.name || "N/A"}
                          </TableCell>

                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {achievement.required_points.toLocaleString()}
                          </TableCell>

                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {formatDate(achievement.created_at)}
                          </TableCell>

                          <TableCell className="px-4 py-3 text-start">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleEditClick(achievement.id)}
                                className="text-xs"
                              >
                                Sửa
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteClick(achievement)}
                                className="text-xs text-red-600 hover:text-red-700 hover:border-red-300"
                              >
                                Xóa
                              </Button>
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
          setAchievementToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa danh hiệu "${achievementToDelete?.name}"?\nHành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />

      <AchievementFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setAchievementToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={achievementToEdit || undefined}
        mode={formMode}
        isLoading={formLoading}
      />
    </>
  );
};

export default AchievementsTable;
