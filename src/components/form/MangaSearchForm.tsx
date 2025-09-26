"use client";
import React, { useState, useCallback, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import AutocompleteSelect from "@/components/form/AutocompleteSelect";
import { apiService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface MangaSearchFilters {
  search: string;
  group_id: string;
  user_id: string;
  artist_id: string;
  doujinshi_id: string;
  is_reviewed: string;
}

interface MangaSearchFormProps {
  onSearch?: (filters: MangaSearchFilters) => void;
  onReset?: () => void;
  loading?: boolean;
}

interface Option {
  value: string;
  label: string;
}

const MangaSearchForm: React.FC<MangaSearchFormProps> = ({
  onSearch,
  onReset,
  loading = false,
}) => {
  const { token } = useAuth();
  const [filters, setFilters] = useState<MangaSearchFilters>({
    search: "",
    group_id: "",
    user_id: "",
    artist_id: "",
    doujinshi_id: "",
    is_reviewed: "",
  });

  const [debouncedFilters, setDebouncedFilters] = useState<MangaSearchFilters>(filters);

  // Debounce filters for auto-search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  // Trigger search when debounced filters change
  useEffect(() => {
    onSearch?.(debouncedFilters);
  }, [debouncedFilters, onSearch]);

  const handleInputChange = (field: keyof MangaSearchFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSearch = useCallback(() => {
    onSearch?.(filters);
  }, [filters, onSearch]);

  const handleReset = useCallback(() => {
    const resetFilters = {
      search: "",
      group_id: "",
      user_id: "",
      artist_id: "",
      doujinshi_id: "",
      is_reviewed: "",
    };
    setFilters(resetFilters);
    setDebouncedFilters(resetFilters);
    onReset?.();
  }, [onReset]);

  // Autocomplete search functions
  const searchGroups = useCallback(async (query: string): Promise<Option[]> => {
    if (!token) return [];
    try {
      const response = await apiService.searchGroups(token, query);
      if (response.success && response.data) {
        return response.data.map((group: any) => ({
          value: group.id,
          label: group.name,
        }));
      }
    } catch (error) {
      console.error("Error searching groups:", error);
    }
    return [];
  }, [token]);

  const searchUsers = useCallback(async (query: string): Promise<Option[]> => {
    if (!token) return [];
    try {
      const response = await apiService.searchUsers(token, query);
      if (response.success && response.data) {
        return response.data.map((user: any) => ({
          value: user.id,
          label: user.name,
        }));
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
    return [];
  }, [token]);

  const searchArtists = useCallback(async (query: string): Promise<Option[]> => {
    if (!token) return [];
    try {
      const response = await apiService.searchArtists(token, query);
      if (response.success && response.data) {
        return response.data.map((artist: any) => ({
          value: artist.id,
          label: artist.name,
        }));
      }
    } catch (error) {
      console.error("Error searching artists:", error);
    }
    return [];
  }, [token]);

  const searchDoujinshis = useCallback(async (query: string): Promise<Option[]> => {
    if (!token) return [];
    try {
      const response = await apiService.searchDoujinshis(token, query);
      if (response.success && response.data) {
        return response.data.map((doujinshi: any) => ({
          value: doujinshi.id,
          label: doujinshi.name,
        }));
      }
    } catch (error) {
      console.error("Error searching doujinshis:", error);
    }
    return [];
  }, [token]);

  const reviewStatusOptions = [
    { value: "", label: "Tất cả" },
    { value: "1", label: "Đã duyệt" },
    { value: "0", label: "Chờ duyệt" },
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tên truyện */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tên truyện, tên khác
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleInputChange("search", e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tên truyện, tên khác"
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>

        {/* Nhóm dịch */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nhóm dịch
          </label>
          <AutocompleteSelect
            placeholder="Tìm nhóm dịch..."
            value={filters.group_id}
            onChange={(value) => handleInputChange("group_id", value)}
            onSearch={searchGroups}
            disabled={loading}
          />
        </div>

        {/* Người đăng */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Người đăng
          </label>
          <AutocompleteSelect
            placeholder="Tìm người đăng..."
            value={filters.user_id}
            onChange={(value) => handleInputChange("user_id", value)}
            onSearch={searchUsers}
            disabled={loading}
          />
        </div>

        {/* Tác giả */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tác giả
          </label>
          <AutocompleteSelect
            placeholder="Tìm tác giả..."
            value={filters.artist_id}
            onChange={(value) => handleInputChange("artist_id", value)}
            onSearch={searchArtists}
            disabled={loading}
          />
        </div>

        {/* Doujinshi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Doujinshi
          </label>
          <AutocompleteSelect
            placeholder="Tìm doujinshi..."
            value={filters.doujinshi_id}
            onChange={(value) => handleInputChange("doujinshi_id", value)}
            onSearch={searchDoujinshis}
            disabled={loading}
          />
        </div>

        {/* Trạng thái duyệt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Duyệt
          </label>
          <select
            value={filters.is_reviewed}
            onChange={(e) => handleInputChange("is_reviewed", e.target.value)}
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          >
            {reviewStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:justify-start">
        <Button
          onClick={handleSearch}
          disabled={loading}
          size="md"
          variant="primary"
          className="sm:w-auto"
        >
          {loading ? "Đang tìm..." : "Tìm kiếm"}
        </Button>

        <Button
          onClick={handleReset}
          disabled={loading}
          size="md"
          variant="outline"
          className="sm:w-auto"
        >
          Reset
        </Button>
      </div>
    </div>
  );
};

export default MangaSearchForm;