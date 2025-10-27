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
import { AdFormModal } from "@/components/ui/modal/AdFormModal";
import Switch from "@/components/form/switch/Switch";
import { apiService, Advertisement } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface PaginationData {
  count: number;
  total: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
}

interface SearchFilters {
  name: string;
  type: string;
  location: string;
  position: string;
  is_active: string;
}

interface AdsApiResponse {
  success: boolean;
  data: Advertisement[];
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

interface AdsTableProps {
  searchFilters?: SearchFilters;
}

const AdsTable: React.FC<AdsTableProps> = ({ searchFilters }) => {
  const { token } = useAuth();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    count: 0,
    total: 0,
    perPage: 50,
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<Advertisement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [adToEdit, setAdToEdit] = useState<Advertisement | null>(null);
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

  const getBadgeColor = (type: string, field: 'type' | 'location') => {
    if (field === 'type') {
      const typeColors: Record<string, string> = {
        banner: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        catfish: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      };
      return typeColors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }

    // Location colors
    const colors: Record<string, string> = {
      home: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      manga_detail: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      chapter_content: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      all_pages: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      banner: 'Banner',
      catfish: 'Catfish',
      other: 'Khác',
    };
    return labels[type] || type;
  };

  const getLocationLabel = (location: string) => {
    const labels: Record<string, string> = {
      home: 'Trang chủ',
      manga_detail: 'Chi tiết manga',
      chapter_content: 'Nội dung chapter',
      all_pages: 'Tất cả trang',
    };
    return labels[location] || location;
  };

  const fetchAds = useCallback(
    async (page = 1, filters?: Partial<SearchFilters>) => {
      if (!token) return;

      setLoading(true);
      try {
        const params: Record<string, unknown> = {
          page: page,
          per_page: pagination.perPage,
          sort: "-created_at",
        };

        // Prepare filters object for API
        if (filters) {
          const apiFilters: Record<string, string> = {};

          if (filters.name && filters.name.trim()) {
            apiFilters.name = filters.name.trim();
          }

          if (filters.type && filters.type.trim()) {
            apiFilters.type = filters.type.trim();
          }

          if (filters.location && filters.location.trim()) {
            apiFilters.location = filters.location.trim();
          }

          if (filters.position && filters.position.trim()) {
            apiFilters.position = filters.position.trim();
          }

          if (filters.is_active && filters.is_active.trim()) {
            apiFilters.is_active = filters.is_active.trim();
          }

          if (Object.keys(apiFilters).length > 0) {
            params.filters = apiFilters;
          }
        }

        const response = await apiService.getAdvertisements(token, params) as AdsApiResponse;

        if (response.success && response.data) {
          setAds(response.data);
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
        console.error("Error fetching advertisements:", error);
      } finally {
        setLoading(false);
      }
    },
    [token, pagination.perPage]
  );

  useEffect(() => {
    fetchAds(1, searchFilters);
  }, [searchFilters, fetchAds]);

  const handlePageChange = (page: number) => {
    fetchAds(page, searchFilters);
  };

  const handleDeleteClick = (ad: Advertisement) => {
    setAdToDelete(ad);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!token || !adToDelete) return;

    setDeleteLoading(true);
    try {
      await apiService.deleteAdvertisement(token, adToDelete.id);
      setDeleteModalOpen(false);
      setAdToDelete(null);
      // Refresh the list after deletion
      await fetchAds(pagination.currentPage, searchFilters);
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      alert("Có lỗi xảy ra khi xóa quảng cáo");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateNew = () => {
    setAdToEdit(null);
    setFormMode("create");
    setFormModalOpen(true);
  };

  const handleEditClick = (ad: Advertisement) => {
    setAdToEdit(ad);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (data: {
    name: string;
    type: string;
    location: string;
    position: string;
    code: string;
    is_active: boolean;
    order: number;
  }) => {
    if (!token) return;

    setFormLoading(true);
    try {
      if (formMode === "create") {
        await apiService.createAdvertisement(token, data);
      } else if (formMode === "edit" && adToEdit) {
        await apiService.updateAdvertisement(token, adToEdit.id, data);
      }

      setFormModalOpen(false);
      setAdToEdit(null);
      // Refresh the list after create/update
      await fetchAds(pagination.currentPage, searchFilters);
    } catch (error: unknown) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Có lỗi xảy ra khi thực hiện hành động này";
      alert(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (ad: Advertisement, checked: boolean) => {
    if (!token) return;

    try {
      await apiService.updateAdvertisement(token, ad.id, {
        is_active: checked,
      });
      // Update local state
      setAds((prevAds) =>
        prevAds.map((a) =>
          a.id === ad.id ? { ...a, is_active: checked } : a
        )
      );
    } catch (error) {
      console.error("Error updating active status:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái kích hoạt");
    }
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
        ) : ads.length === 0 ? (
          <>
            <div className="flex items-center justify-end">
              <Button size="md" variant="primary" onClick={handleCreateNew}>
                Tạo mới
              </Button>
            </div>
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  Không tìm thấy quảng cáo nào
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
                <div className="min-w-[1200px]">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Tên
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Loại
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Vị trí trang
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Vị trí cụ thể
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Kích hoạt
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Thứ tự
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
                      {ads.map((ad) => (
                        <TableRow key={ad.id}>
                          <TableCell className="px-5 py-4 text-start">
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {ad.name}
                            </span>
                          </TableCell>

                          <TableCell className="px-5 py-4 text-start">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(ad.type, 'type')}`}>
                              {getTypeLabel(ad.type)}
                            </span>
                          </TableCell>

                          <TableCell className="px-5 py-4 text-start">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(ad.location, 'location')}`}>
                              {getLocationLabel(ad.location)}
                            </span>
                          </TableCell>

                          <TableCell className="px-5 py-4 text-start">
                            {ad.position ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 font-mono">
                                {ad.position}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600 text-xs">-</span>
                            )}
                          </TableCell>

                          <TableCell className="px-4 py-3 text-start">
                            <Switch
                              label=""
                              defaultChecked={ad.is_active}
                              onChange={(checked) => handleToggleActive(ad, checked)}
                            />
                          </TableCell>

                          <TableCell className="px-4 py-3 text-start">
                            <span className="text-theme-sm font-mono text-gray-600 dark:text-gray-400">
                              {ad.order}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {formatDate(ad.created_at)}
                          </TableCell>

                          <TableCell className="px-4 py-3 text-start">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditClick(ad)}
                                className="text-xs"
                              >
                                Sửa
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteClick(ad)}
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
          setAdToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa quảng cáo "${adToDelete?.name}"?\nHành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />

      <AdFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setAdToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={adToEdit || undefined}
        mode={formMode}
        isLoading={formLoading}
      />
    </>
  );
};

export default AdsTable;
