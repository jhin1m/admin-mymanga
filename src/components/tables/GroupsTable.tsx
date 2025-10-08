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
import { GroupFormModal } from "@/components/ui/modal/GroupFormModal";
import { apiService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface Group {
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

interface GroupsTableProps {
  searchFilters?: SearchFilters;
}

const GroupsTable: React.FC<GroupsTableProps> = ({ searchFilters }) => {
  const { token } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    count: 0,
    total: 0,
    perPage: 50,
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
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

  const fetchGroups = useCallback(
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

        const response = await apiService.getGroups(token, params);

        if (response.success && response.data) {
          setGroups(response.data);
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
        console.error("Error fetching groups:", error);
      } finally {
        setLoading(false);
      }
    },
    [token, pagination.perPage]
  );

  useEffect(() => {
    fetchGroups(1, searchFilters);
  }, [searchFilters]);

  const handlePageChange = (page: number) => {
    fetchGroups(page, searchFilters);
  };

  const handleDeleteClick = (group: Group) => {
    setGroupToDelete(group);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!token || !groupToDelete) return;

    setDeleteLoading(true);
    try {
      await apiService.deleteGroup(token, groupToDelete.id);
      setDeleteModalOpen(false);
      setGroupToDelete(null);
      // Refresh the list after deletion
      await fetchGroups(pagination.currentPage, searchFilters);
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Có lỗi xảy ra khi xóa nhóm dịch");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditClick = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    setGroupToEdit(group);
    setFormMode("edit");
    setFormModalOpen(true);
  };

  const handleCreateNew = () => {
    setGroupToEdit(null);
    setFormMode("create");
    setFormModalOpen(true);
  };

  const handleFormSubmit = async (name: string) => {
    if (!token) return;

    setFormLoading(true);
    try {
      if (formMode === "create") {
        await apiService.createGroup(token, { name });
      } else if (formMode === "edit" && groupToEdit) {
        await apiService.updateGroup(token, groupToEdit.id, { name });
      }

      setFormModalOpen(false);
      setGroupToEdit(null);
      // Refresh the list after create/update
      await fetchGroups(pagination.currentPage, searchFilters);
    } catch (error: any) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error?.message || "Có lỗi xảy ra khi thực hiện hành động này";
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
        ) : groups.length === 0 ? (
          <>
            <div className="flex items-center justify-end">
              <Button size="md" variant="primary" onClick={handleCreateNew}>
                Tạo mới
              </Button>
            </div>
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-gray-500 dark:text-gray-400 mb-2">
                  Không tìm thấy nhóm dịch nào
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
                          Tên nhóm dịch
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
                      {groups.map((group) => (
                        <TableRow key={group.id}>
                          <TableCell className="px-5 py-4 text-start">
                            <span className="text-theme-sm font-mono text-gray-600 dark:text-gray-400">
                              {group.id.substring(0, 8)}...
                            </span>
                          </TableCell>

                          <TableCell className="px-5 py-4 text-start">
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {group.name}
                            </span>
                          </TableCell>

                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {group.user?.name || "N/A"}
                          </TableCell>

                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {formatDate(group.created_at)}
                          </TableCell>

                          <TableCell className="px-4 py-3 text-start">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleEditClick(group.id)}
                                className="text-xs"
                              >
                                Sửa
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteClick(group)}
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
          setGroupToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa nhóm dịch "${groupToDelete?.name}"?\nHành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="danger"
        isLoading={deleteLoading}
      />

      <GroupFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setGroupToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        initialName={groupToEdit?.name || ""}
        mode={formMode}
        isLoading={formLoading}
      />
    </>
  );
};

export default GroupsTable;
