"use client";
import React, { useState, useCallback, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";

interface SearchFilters {
  report_type: string;
  user_id: string;
  sort: string;
}

interface ChapterReportSearchFormProps {
  onSearch?: (filters: SearchFilters) => void;
  onReset?: () => void;
  loading?: boolean;
}

const ChapterReportSearchForm: React.FC<ChapterReportSearchFormProps> = ({
  onSearch,
  onReset,
  loading = false,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    report_type: "",
    user_id: "",
    sort: "-created_at",
  });

  const [debouncedFilters, setDebouncedFilters] = useState<SearchFilters>(filters);

  // Debounce filters for auto-search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [filters]);

  // Trigger search when debounced filters change
  useEffect(() => {
    onSearch?.(debouncedFilters);
  }, [debouncedFilters, onSearch]);

  const reportTypeOptions = [
    { value: "broken_images", label: "Ảnh bị lỗi/không load được" },
    { value: "missing_images", label: "Thiếu ảnh" },
    { value: "wrong_order", label: "Sai thứ tự ảnh" },
    { value: "wrong_chapter", label: "Sai chapter" },
    { value: "duplicate", label: "Chapter trùng" },
    { value: "other", label: "Lỗi khác" },
  ];

  const sortOptions = [
    { value: "-created_at", label: "Mới nhất" },
    { value: "created_at", label: "Cũ nhất" },
    { value: "-updated_at", label: "Cập nhật mới nhất" },
    { value: "updated_at", label: "Cập nhật cũ nhất" },
    { value: "report_type", label: "Loại lỗi" },
  ];

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSearch = useCallback(() => {
    onSearch?.(filters);
  }, [filters, onSearch]);

  const handleReset = useCallback(() => {
    const resetFilters = {
      report_type: "",
      user_id: "",
      sort: "-created_at",
    };
    setFilters(resetFilters);
    setDebouncedFilters(resetFilters);
    onReset?.();
  }, [onReset]);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Bộ lọc & Tìm kiếm
        </h3>
        <Button
          onClick={handleReset}
          disabled={loading}
          size="sm"
          variant="outline"
        >
          Xoá bộ lọc
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Loại lỗi
          </label>
          <Select
            options={reportTypeOptions}
            placeholder="Chọn loại lỗi"
            onChange={(value) => handleInputChange("report_type", value)}
            defaultValue={filters.report_type}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            User ID
          </label>
          <input
            type="text"
            value={filters.user_id}
            onChange={(e) => handleInputChange("user_id", e.target.value)}
            placeholder="Nhập User ID"
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sắp xếp theo
          </label>
          <Select
            options={sortOptions}
            placeholder="Chọn cách sắp xếp"
            onChange={(value) => handleInputChange("sort", value)}
            defaultValue={filters.sort}
            className="w-full"
          />
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
      </div>
    </div>
  );
};

export default ChapterReportSearchForm;