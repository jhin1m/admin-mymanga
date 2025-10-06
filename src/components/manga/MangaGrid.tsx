"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/ui/pagination/Pagination";
import Alert from "@/components/ui/alert/Alert";
import { ConfirmModal } from "@/components/ui/modal/ConfirmModal";
import { apiService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { PencilIcon, CheckCircleIcon, TrashBinIcon } from "@/icons";

interface Manga {
  id: string;
  user_id: string;
  artist_id: string | null;
  last_chapter_id: string | null;
  doujinshi_id: string | null;
  group_id: string | null;
  name: string;
  name_alt: string | null;
  pilot: string;
  status: number;
  views: number;
  views_day: number;
  views_week: number;
  average_rating: string;
  total_ratings: number;
  is_hot: number;
  hot_at: string | null;
  is_reviewed: number;
  slug: string;
  finished_by: string | null;
  created_at: string;
  updated_at: string;
  cover_full_url: string;
  group: any;
  user: {
    id: string;
    name: string;
    email: string;
    avatar_full_url: string;
  };
  genres: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  artist: any;
  doujinshi: any;
}

interface PaginationData {
  count: number;
  total: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
  links?: {
    next?: string;
  };
}

interface MangaSearchFilters {
  search: string;
  group_id: string;
  user_id: string;
  artist_id: string;
  doujinshi_id: string;
  is_reviewed: string;
}

interface MangaGridProps {
  searchFilters?: MangaSearchFilters;
}

const MangaGrid: React.FC<MangaGridProps> = ({ searchFilters }) => {
  const { token } = useAuth();
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    count: 0,
    total: 0,
    perPage: 50,
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; mangaId: string; mangaName: string }>({
    isOpen: false,
    mangaId: '',
    mangaName: '',
  });
  const [alert, setAlert] = useState<{ show: boolean; variant: 'success' | 'error'; title: string; message: string }>({
    show: false,
    variant: 'success',
    title: '',
    message: '',
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchMangas = useCallback(async (page = 1, filters?: Partial<MangaSearchFilters>) => {
    if (!token) return;

    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: page,
        per_page: pagination.perPage,
        sort: '-updated_at',
        include: 'group,user,genres,artist,doujinshi',
      };

      // Prepare filters object for API
      if (filters) {
        const apiFilters: Record<string, string> = {};

        if (filters.search && filters.search.trim()) {
          apiFilters.search = filters.search.trim();
        }
        if (filters.group_id && filters.group_id.trim()) {
          apiFilters.group_id = filters.group_id.trim();
        }
        if (filters.user_id && filters.user_id.trim()) {
          apiFilters.user_id = filters.user_id.trim();
        }
        if (filters.artist_id && filters.artist_id.trim()) {
          apiFilters.artist_id = filters.artist_id.trim();
        }
        if (filters.doujinshi_id && filters.doujinshi_id.trim()) {
          apiFilters.doujinshi_id = filters.doujinshi_id.trim();
        }
        if (filters.is_reviewed && filters.is_reviewed.trim()) {
          apiFilters.is_reviewed = filters.is_reviewed.trim();
        }

        if (Object.keys(apiFilters).length > 0) {
          params.filters = apiFilters;
        }
      }

      const response = await apiService.getMangas(token, params);

      if (response.success && response.data) {
        setMangas(response.data);
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
      console.error('Error fetching mangas:', error);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.perPage]);

  useEffect(() => {
    fetchMangas(1, searchFilters);
  }, [searchFilters]);

  const handlePageChange = (page: number) => {
    fetchMangas(page, searchFilters);
  };

  const handleApprove = async (mangaId: string, currentStatus: boolean) => {
    if (!token) return;

    setActionLoading(prev => ({ ...prev, [`approve-${mangaId}`]: true }));

    try {
      const newStatus = !currentStatus;
      await apiService.updateMangaStatus(token, mangaId, newStatus);

      // Update local state instead of refetching
      setMangas(prevMangas =>
        prevMangas.map(manga =>
          manga.id === mangaId
            ? { ...manga, is_reviewed: newStatus ? 1 : 0 }
            : manga
        )
      );

      // Show success alert
      setAlert({
        show: true,
        variant: 'success',
        title: newStatus ? 'Duyệt truyện thành công' : 'Huỷ duyệt truyện thành công',
        message: newStatus ? 'Truyện đã được duyệt.' : 'Truyện đã được huỷ duyệt.',
      });

      // Auto hide alert after 3 seconds
      setTimeout(() => {
        setAlert(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      console.error('Error updating manga status:', error);
      setAlert({
        show: true,
        variant: 'error',
        title: 'Cập nhật trạng thái thất bại',
        message: 'Có lỗi xảy ra khi cập nhật trạng thái truyện. Vui lòng thử lại.',
      });

      // Auto hide alert after 3 seconds
      setTimeout(() => {
        setAlert(prev => ({ ...prev, show: false }));
      }, 3000);
    } finally {
      setActionLoading(prev => ({ ...prev, [`approve-${mangaId}`]: false }));
    }
  };

  const handleDeleteClick = (mangaId: string, mangaName: string) => {
    setDeleteModal({
      isOpen: true,
      mangaId,
      mangaName,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!token) return;

    const { mangaId, mangaName } = deleteModal;
    setActionLoading(prev => ({ ...prev, [`delete-${mangaId}`]: true }));

    try {
      await apiService.deleteManga(token, mangaId);

      // Remove manga from local state instead of refetching
      setMangas(prevMangas => prevMangas.filter(manga => manga.id !== mangaId));

      // Update pagination count
      setPagination(prev => ({
        ...prev,
        count: Math.max(0, prev.count - 1),
        total: Math.max(0, prev.total - 1),
      }));

      setDeleteModal({ isOpen: false, mangaId: '', mangaName: '' });
      setAlert({
        show: true,
        variant: 'success',
        title: 'Xóa truyện thành công',
        message: `Đã xóa truyện "${mangaName}" thành công.`,
      });

      // Auto hide alert after 3 seconds
      setTimeout(() => {
        setAlert(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      console.error('Error deleting manga:', error);
      setDeleteModal({ isOpen: false, mangaId: '', mangaName: '' });
      setAlert({
        show: true,
        variant: 'error',
        title: 'Xóa truyện thất bại',
        message: 'Có lỗi xảy ra khi xóa truyện. Vui lòng thử lại.',
      });

      // Auto hide alert after 3 seconds
      setTimeout(() => {
        setAlert(prev => ({ ...prev, show: false }));
      }, 3000);
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-${mangaId}`]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-80 w-full"></div>
              <div className="mt-3 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!loading && mangas.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-2 text-lg">
            Không tìm thấy truyện nào
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-500">
            Thử thay đổi điều kiện tìm kiếm hoặc xóa bộ lọc
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Notification */}
      {alert.show && (
        <div className="mb-4">
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
          />
        </div>
      )}

      {/* Manga Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {mangas.map((manga) => (
          <div
            key={manga.id}
            className="group relative bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Cover Image */}
            <div className="relative h-50 md:h-60 bg-gray-100 dark:bg-gray-800">
              <Image
                src={manga.cover_full_url}
                alt={manga.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "/images/manga/default-cover.png";
                }}
              />

              {/* Status badges */}
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                <Badge
                  variant="solid"
                  size="sm"
                  color={manga.is_reviewed ? "success" : "warning"}
                >
                  {manga.is_reviewed ? "Đã duyệt" : "Chờ duyệt"}
                </Badge>
                {manga.is_hot === 1 && (
                  <Badge variant="solid" size="sm" color="error">
                    Hot
                  </Badge>
                )}
              </div>

              {/* Action buttons overlay */}
              <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                <Link href={`/admin/mangas/${manga.id}/edit`} className="flex-1">
                  <button
                    className="w-full h-9 inline-flex items-center justify-center bg-brand-500 text-white rounded-lg shadow-lg hover:bg-brand-600 transition-colors"
                    title="Sửa"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                </Link>
                <button
                  className={`flex-1 h-9 inline-flex items-center justify-center rounded-lg shadow-lg transition-colors ${
                    manga.is_reviewed
                      ? "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                  onClick={() => handleApprove(manga.id, !!manga.is_reviewed)}
                  disabled={actionLoading[`approve-${manga.id}`]}
                  title={manga.is_reviewed ? "Huỷ duyệt" : "Duyệt"}
                >
                  {actionLoading[`approve-${manga.id}`] ? (
                    <span className="text-xs">...</span>
                  ) : (
                    <CheckCircleIcon className="w-5 h-5" />
                  )}
                </button>
                <button
                  className="flex-1 h-9 inline-flex items-center justify-center bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  onClick={() => handleDeleteClick(manga.id, manga.name)}
                  disabled={actionLoading[`delete-${manga.id}`]}
                  title="Xóa"
                >
                  {actionLoading[`delete-${manga.id}`] ? (
                    <span className="text-xs">...</span>
                  ) : (
                    <TrashBinIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <Link
                href={`/admin/mangas/${manga.id}/edit`}
                className="block group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                  {manga.name}
                </h3>
              </Link>

              {manga.name_alt && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                  {manga.name_alt}
                </p>
              )}

              {/* Genres */}
              <div className="flex flex-wrap gap-1 mb-3">
                {manga.genres.slice(0, 3).map((genre) => (
                  <span
                    key={genre.id}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                  >
                    {genre.name}
                  </span>
                ))}
                {manga.genres.length > 3 && (
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                    +{manga.genres.length - 3}
                  </span>
                )}
              </div>

              {/* Meta info */}
              <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Lượt xem:</span>
                  <span className="font-medium">{manga.views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Người đăng:</span>
                  <span className="font-medium">{manga.user.name}</span>
                </div>
                {manga.group && (
                  <div className="flex justify-between">
                    <span>Nhóm:</span>
                    <span className="font-medium">{manga.group.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Cập nhật:</span>
                  <span className="font-medium">{formatDate(manga.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        total={pagination.total}
        perPage={pagination.perPage}
        onPageChange={handlePageChange}
        loading={loading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, mangaId: '', mangaName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa truyện"
        message={`Bạn có chắc chắn muốn xóa truyện "${deleteModal.mangaName}"?\n\nHành động này không thể hoàn tác.`}
        confirmText="Xóa truyện"
        cancelText="Hủy"
        confirmVariant="danger"
        isLoading={actionLoading[`delete-${deleteModal.mangaId}`]}
      />
    </div>
  );
};

export default MangaGrid;