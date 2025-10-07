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
import { ArtistFormModal } from "@/components/ui/modal/ArtistFormModal";
import { apiService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface Artist {
  id: string;
  name: string;
  slug: string;
  user_id: string;
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

interface AuthorsTableProps {
  searchFilters?: SearchFilters;
}

const AuthorsTable: React.FC<AuthorsTableProps> = ({ searchFilters }) => {
  const { token } = useAuth();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    count: 0,
    total: 0,
    perPage: 50,
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [artistToDelete, setArtistToDelete] = useState<Artist | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [artistToEdit, setArtistToEdit] = useState<Artist | null>(null);
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

  const fetchArtists = useCallback(
    async (page = 1, filters?: Partial<SearchFilters>) => {
      if (!token) return;

      setLoading(true);
      try {
        const params: Record<string, any> = {
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

        const response = await apiService.getArtists(token, params);

        if (response.success && response.data) {
          setArtists(response.data);
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
        console.error("Error fetching artists:", error);
      } finally {
        setLoading(false);
      }
    },
    [token, pagination.perPage]
  );

  useEffect(() => {
    fetchArtists(1, searchFilters);
  }, [searchFilters]);

  const handlePageChange = (page: number) => {
    fetchArtists(page, searchFilters);
  };

  const handleDeleteClick = (artist: Artist) => {
    setArtistToDelete(artist);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!token || !artistToDelete) return;

    setDeleteLoading(true);
    try {
      await apiService.deleteArtist(token, artistToDelete.id);
      setDeleteModalOpen(false);
      setArtistToDelete(null);
      // Refresh the list after deletion
      await fetchArtists(pagination.currentPage, searchFilters);
    } catch (error) {
      console.error("Error deleting artist:", error);
      alert("Có lỗi xảy ra khi xóa tác giả");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditClick = (artistId: string) => {
    const artist = artists.find((a) => a.id === artistId);
    if (!artist) return;

    setArtistToEdit(artist);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleCreateNew = () => {
    setArtistToEdit(null);
    setFormMode("create");
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (name: string) => {
    if (!token) return;

    setFormLoading(true);
    try {
      if (formMode === "create") {
        await apiService.createArtist(token, { name });
      } else if (formMode === "edit" && artistToEdit) {
        await apiService.updateArtist(token, artistToEdit.id, { name });
      }

      setFormModalOpen(false);
      setArtistToEdit(null);
      // Refresh the list after create/update
      await fetchArtists(pagination.currentPage, searchFilters);
    } catch (error: any) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error?.message || "Có lỗi xảy ra khi thực hiện hành động này";
      alert(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  if (!loading && artists.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button size="md" variant="primary" onClick={handleCreateNew}>
            Tạo mới
          </Button>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              Không tìm thấy tác giả nào
            </div>
            <div className="text-sm text-gray-400 dark:text-gray-500">
              Thử thay đổi điều kiện tìm kiếm hoặc xóa bộ lọc
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button size="md" variant="primary" onClick={handleCreateNew}>
          Tạo mới
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[800px]">
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
                    Tên tác giả
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
                {artists.map((artist) => (
                  <TableRow key={artist.id}>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="text-theme-sm font-mono text-gray-600 dark:text-gray-400">
                        {artist.id.substring(0, 8)}...
                      </span>
                    </TableCell>

                    <TableCell className="px-5 py-4 text-start">
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {artist.name}
                      </span>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {artist.user?.name || "N/A"}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {formatDate(artist.created_at)}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-start">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleEditClick(artist.id)}
                          className="text-xs"
                        >
                          Sửa
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClick(artist)}
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

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setArtistToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa tác giả "${artistToDelete?.name}"?\nHành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />

      <ArtistFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setArtistToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialName={artistToEdit?.name || ""}
        mode={formMode}
        isLoading={formLoading}
      />
    </div>
  );
};

export default AuthorsTable;
