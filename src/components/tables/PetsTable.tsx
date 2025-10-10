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
import { PetFormModal } from "@/components/ui/modal/PetFormModal";
import { apiService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface Pet {
  id: string;
  name: string;
  price: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  image_full_url: string;
  user?: {
    id: string;
    name: string;
    email: string;
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

interface PetsApiResponse {
  success: boolean;
  data: Pet[];
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

interface PetsTableProps {
  searchFilters?: SearchFilters;
}

const PetsTable: React.FC<PetsTableProps> = ({ searchFilters }) => {
  const { token } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    count: 0,
    total: 0,
    perPage: 50,
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [petToEdit, setPetToEdit] = useState<Pet | null>(null);
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

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN");
  };

  const fetchPets = useCallback(
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

        const response = await apiService.getPets(token, params) as PetsApiResponse;

        if (response.success && response.data) {
          setPets(response.data);
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
        console.error("Error fetching pets:", error);
      } finally {
        setLoading(false);
      }
    },
    [token, pagination.perPage]
  );

  useEffect(() => {
    fetchPets(1, searchFilters);
  }, [searchFilters, fetchPets]);

  const handlePageChange = (page: number) => {
    fetchPets(page, searchFilters);
  };

  const handleDeleteClick = (pet: Pet) => {
    setPetToDelete(pet);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!token || !petToDelete) return;

    setDeleteLoading(true);
    try {
      await apiService.deletePet(token, petToDelete.id);
      setDeleteModalOpen(false);
      setPetToDelete(null);
      // Refresh the list after deletion
      await fetchPets(pagination.currentPage, searchFilters);
    } catch (error) {
      console.error("Error deleting pet:", error);
      alert("Có lỗi xảy ra khi xóa bạn đồng hành");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditClick = (petId: string) => {
    const pet = pets.find((p) => p.id === petId);
    if (!pet) return;

    setPetToEdit(pet);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleCreateNew = () => {
    setPetToEdit(null);
    setFormMode("create");
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (data: { name: string; price: number; image?: File | null }) => {
    if (!token) return;

    setFormLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("price", data.price.toString());

      if (data.image) {
        formData.append("image", data.image);
      }

      if (formMode === "create") {
        await apiService.createPet(token, formData);
      } else if (formMode === "edit" && petToEdit) {
        await apiService.updatePet(token, petToEdit.id, formData);
      }

      setFormModalOpen(false);
      setPetToEdit(null);
      // Refresh the list after create/update
      await fetchPets(pagination.currentPage, searchFilters);
    } catch (error: unknown) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Có lỗi xảy ra khi thực hiện hành động này";
      alert(errorMessage);
    } finally {
      setFormLoading(false);
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
        ) : pets.length === 0 ? (
          <>
            <div className="flex items-center justify-end">
              <Button size="md" variant="primary" onClick={handleCreateNew}>
                Tạo mới
              </Button>
            </div>
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  Không tìm thấy bạn đồng hành nào
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
                          Preview
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Tên bạn đồng hành
                        </TableCell>
                        <TableCell
                          isHeader
                          className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                        >
                          Giá
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
                      {pets.map((pet) => (
                        <TableRow key={pet.id}>
                          <TableCell className="px-5 py-4 text-start">
                            <div className="flex items-center justify-center w-[80px] h-[80px] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                              <img
                                src={pet.image_full_url}
                                alt={pet.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='monospace' font-size='14' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
                                }}
                              />
                            </div>
                          </TableCell>

                          <TableCell className="px-5 py-4 text-start">
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {pet.name}
                            </span>
                          </TableCell>

                          <TableCell className="px-5 py-4 text-start">
                            <span className="block text-gray-700 text-theme-sm dark:text-gray-300">
                              {formatPrice(pet.price)}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {pet.user?.name || "N/A"}
                          </TableCell>

                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {formatDate(pet.created_at)}
                          </TableCell>

                          <TableCell className="px-4 py-3 text-start">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleEditClick(pet.id)}
                                className="text-xs"
                              >
                                Sửa
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteClick(pet)}
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
          setPetToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa bạn đồng hành "${petToDelete?.name}"?\nHành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />

      <PetFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setPetToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={petToEdit ? {
          name: petToEdit.name,
          price: petToEdit.price,
          image_full_url: petToEdit.image_full_url,
        } : undefined}
        mode={formMode}
        isLoading={formLoading}
      />
    </>
  );
};

export default PetsTable;
