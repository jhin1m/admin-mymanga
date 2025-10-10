"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/ui/pagination/Pagination";
import { apiService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  total_points: number;
  used_points: number;
  banned_until: string | null;
  created_at: string;
  avatar_full_url: string;
}

interface PaginationData {
  count: number;
  total: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
}

interface SearchFilters {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

interface UsersApiResponse {
  success: boolean;
  data: User[];
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

interface MembersTableProps {
  searchFilters?: SearchFilters;
}

const MembersTable: React.FC<MembersTableProps> = ({
  searchFilters,
}) => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    count: 0,
    total: 0,
    perPage: 50,
    currentPage: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBanStatus = (bannedUntil: string | null) => {
    if (!bannedUntil) return null;
    const banDate = new Date(bannedUntil);
    const now = new Date();
    return banDate > now ? banDate : null;
  };

  const fetchUsers = useCallback(async (page = 1, filters?: Partial<SearchFilters>) => {
    if (!token) return;

    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: page,
        per_page: pagination.perPage,
        sort: '-created_at',
      };

      // Prepare filters object for API
      if (filters) {
        const apiFilters: Record<string, string> = {};

        if (filters.user_id && filters.user_id.trim()) {
          apiFilters.id = filters.user_id.trim();
        }
        if (filters.name && filters.name.trim()) {
          apiFilters.name = filters.name.trim();
        }
        if (filters.email && filters.email.trim()) {
          apiFilters.email = filters.email.trim();
        }
        if (filters.role && filters.role.trim()) {
          apiFilters.role = filters.role.trim();
        }

        if (Object.keys(apiFilters).length > 0) {
          params.filters = apiFilters;
        }
      }

      const response = await apiService.getUsers(token, params) as UsersApiResponse;

      if (response.success && response.data) {
        setUsers(response.data);
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
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.perPage]);

  useEffect(() => {
    fetchUsers(1, searchFilters);
  }, [searchFilters, fetchUsers]);

  const handlePageChange = (page: number) => {
    fetchUsers(page, searchFilters);
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    if (!token) return;

    setActionLoading(prev => ({ ...prev, [`ban-${userId}`]: true }));

    try {
      if (isBanned) {
        await apiService.unbanUser(token, userId);
      } else {
        await apiService.banUser(token, userId, '7d'); // Default ban for 7 days
      }

      // Refresh the user list after action
      await fetchUsers(pagination.currentPage, searchFilters);
    } catch (error) {
      console.error('Error banning/unbanning user:', error);
      alert('Có lỗi xảy ra khi thực hiện hành động này');
    } finally {
      setActionLoading(prev => ({ ...prev, [`ban-${userId}`]: false }));
    }
  };

  const handleDeleteComments = async (userId: string) => {
    if (!token) return;

    const confirmed = confirm('Bạn có chắc chắn muốn xóa tất cả bình luận của người dùng này?');
    if (!confirmed) return;

    setActionLoading(prev => ({ ...prev, [`delete-${userId}`]: true }));

    try {
      await apiService.deleteUserComments(token, userId);
      alert('Đã xóa tất cả bình luận của người dùng thành công');
    } catch (error) {
      console.error('Error deleting user comments:', error);
      alert('Có lỗi xảy ra khi xóa bình luận');
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-${userId}`]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (!loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-2">
            Không tìm thấy thành viên nào
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-500">
            Thử thay đổi điều kiện tìm kiếm hoặc xóa bộ lọc
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
                    User ID
                  </TableCell>
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
                    Email
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Tổng điểm
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Điểm dùng
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Hạn cấm
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
                {users.map((member) => {
                  const banStatus = getBanStatus(member.banned_until);
                  const isBanned = banStatus !== null;

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="text-theme-sm font-mono text-gray-600 dark:text-gray-400">
                          {member.id.substring(0, 8)}...
                        </span>
                      </TableCell>

                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full">
                            <Image
                              width={40}
                              height={40}
                              src={member.avatar_full_url}
                              alt={member.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/images/avatars/default.png";
                              }}
                            />
                          </div>
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {member.name}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {member.email}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <span className="font-medium text-brand-600 dark:text-brand-400">
                          {member.total_points.toLocaleString()}
                        </span>
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <span className="font-medium">
                          {member.used_points.toLocaleString()}
                        </span>
                      </TableCell>

                      <TableCell className="px-4 py-3 text-start">
                        {isBanned ? (
                          <Badge size="sm" color="error">
                            Đến {formatDate(member.banned_until!)}
                          </Badge>
                        ) : (
                          <Badge size="sm" color="success">
                            Hoạt động
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {formatDate(member.created_at)}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={isBanned ? "primary" : "outline"}
                            onClick={() => handleBanUser(member.id, isBanned)}
                            disabled={actionLoading[`ban-${member.id}`]}
                            className="text-xs"
                          >
                            {actionLoading[`ban-${member.id}`]
                              ? "..."
                              : isBanned
                                ? "Bỏ cấm"
                                : "Cấm"
                            }
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteComments(member.id)}
                            disabled={actionLoading[`delete-${member.id}`]}
                            className="text-xs text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            {actionLoading[`delete-${member.id}`] ? "..." : "Xóa CMT"}
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
    </div>
  );
};

export default MembersTable;