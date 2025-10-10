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
import { GenreFormModal } from "@/components/ui/modal/GenreFormModal";
import Switch from "@/components/form/switch/Switch";
import { apiService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface Genre {
  id: number;
  name: string;
  slug: string;
  show_on_pc: number;
  show_on_mb: number;
  created_at: string;
  updated_at: string;
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

interface GenresApiResponse {
  success: boolean;
  data: Genre[];
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

interface GenresTableProps {
  searchFilters?: SearchFilters;
}

const GenresTable: React.FC<GenresTableProps> = ({ searchFilters }) => {
  const { token } = useAuth();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    count: 0,
    total: 0,
    perPage: 50,
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [genreToDelete, setGenreToDelete] = useState<Genre | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [genreToEdit, setGenreToEdit] = useState<Genre | null>(null);
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

  const fetchGenres = useCallback(
    async (page = 1, filters?: Partial<SearchFilters>) => {
      if (!token) return;

      setLoading(true);
      try {
        const params: Record<string, unknown> = {
          page: page,
          per_page: pagination.perPage,
          sort: "-id",
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

        const response = await apiService.getGenresWithParams(token, params) as GenresApiResponse;

        if (response.success && response.data) {
          setGenres(response.data);
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
        console.error("Error fetching genres:", error);
      } finally {
        setLoading(false);
      }
    },
    [token, pagination.perPage]
  );

  useEffect(() => {
    fetchGenres(1, searchFilters);
  }, [searchFilters, fetchGenres]);

  const handlePageChange = (page: number) => {
    fetchGenres(page, searchFilters);
  };

  const handleDeleteClick = (genre: Genre) => {
    setGenreToDelete(genre);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!token || !genreToDelete) return;

    setDeleteLoading(true);
    try {
      await apiService.deleteGenre(token, genreToDelete.id.toString());
      setDeleteModalOpen(false);
      setGenreToDelete(null);
      // Refresh the list after deletion
      await fetchGenres(pagination.currentPage, searchFilters);
    } catch (error) {
      console.error("Error deleting genre:", error);
      alert("Có lỗi xảy ra khi xóa thể loại");
    } finally {
      setDeleteLoading(false);
    }
  };


  const handleCreateNew = () => {
    setGenreToEdit(null);
    setFormMode("create");
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (name: string) => {
    if (!token) return;

    setFormLoading(true);
    try {
      if (formMode === "create") {
        await apiService.createGenre(token, { name });
      } else if (formMode === "edit" && genreToEdit) {
        await apiService.updateGenre(token, genreToEdit.id.toString(), { name });
      }

      setFormModalOpen(false);
      setGenreToEdit(null);
      // Refresh the list after create/update
      await fetchGenres(pagination.currentPage, searchFilters);
    } catch (error: unknown) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Có lỗi xảy ra khi thực hiện hành động này";
      alert(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleShowOnPc = async (genre: Genre, checked: boolean) => {
    if (!token) return;

    try {
      await apiService.updateGenre(token, genre.id.toString(), {
        show_on_pc: checked ? 1 : 0,
      });
      // Update local state
      setGenres((prevGenres) =>
        prevGenres.map((g) =>
          g.id === genre.id ? { ...g, show_on_pc: checked ? 1 : 0 } : g
        )
      );
    } catch (error) {
      console.error("Error updating show_on_pc:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái hiển thị trên PC");
    }
  };

  const handleToggleShowOnMb = async (genre: Genre, checked: boolean) => {
    if (!token) return;

    try {
      await apiService.updateGenre(token, genre.id.toString(), {
        show_on_mb: checked ? 1 : 0,
      });
      // Update local state
      setGenres((prevGenres) =>
        prevGenres.map((g) =>
          g.id === genre.id ? { ...g, show_on_mb: checked ? 1 : 0 } : g
        )
      );
    } catch (error) {
      console.error("Error updating show_on_mb:", error);
      alert("Có lỗi xảy ra khi cập nhật trạng thái hiển thị trên MB");
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
        ) : genres.length === 0 ? (
          <>
            <div className="flex items-center justify-end">
              <Button size="md" variant="primary" onClick={handleCreateNew}>
                Tạo mới
              </Button>
            </div>
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  Không tìm thấy thể loại nào
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
                          Tên thể loại
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Hiện trên PC
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Hiện trên MB
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
                      {genres.map((genre) => (
                        <TableRow key={genre.id}>
                          <TableCell className="px-5 py-4 text-start">
                            <span className="text-theme-sm font-mono text-gray-600 dark:text-gray-400">
                              {genre.id}
                            </span>
                          </TableCell>

                          <TableCell className="px-5 py-4 text-start">
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {genre.name}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3 text-start">
                            <Switch
                              label=""
                              defaultChecked={genre.show_on_pc === 1}
                              onChange={(checked) => handleToggleShowOnPc(genre, checked)}
                            />
                          </TableCell>

                          <TableCell className="px-4 py-3 text-start">
                            <Switch
                              label=""
                              defaultChecked={genre.show_on_mb === 1}
                              onChange={(checked) => handleToggleShowOnMb(genre, checked)}
                            />
                          </TableCell>

                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {formatDate(genre.created_at)}
                          </TableCell>

                          <TableCell className="px-4 py-3 text-start">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteClick(genre)}
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
          setGenreToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa thể loại "${genreToDelete?.name}"?\nHành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />

      <GenreFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setGenreToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialName={genreToEdit?.name || ""}
        mode={formMode}
        isLoading={formLoading}
      />
    </>
  );
};

export default GenresTable;
