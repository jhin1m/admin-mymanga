"use client";
import React, { useState, useCallback, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";

interface SearchFilters {
  username: string;
  created_at_start: string;
  created_at_end: string;
}

interface CommentSearchFormProps {
  onSearch?: (filters: SearchFilters) => void;
  onReset?: () => void;
  loading?: boolean;
}

const CommentSearchForm: React.FC<CommentSearchFormProps> = ({
  onSearch,
  onReset,
  loading = false,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    username: "",
    created_at_start: "",
    created_at_end: "",
  });

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
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
      username: "",
      created_at_start: "",
      created_at_end: "",
    };
    setFilters(resetFilters);
    onReset?.();
  }, [onReset]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tên thành viên
          </label>
          <input
            type="text"
            value={filters.username}
            onChange={(e) => handleInputChange("username", e.target.value)}
            placeholder="Nhập tên thành viên"
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>

        <div>
          <DatePicker
            id="comment-date-start"
            label="Ngày comment (từ)"
            placeholder="Chọn ngày bắt đầu"
            defaultDate={filters.created_at_start || undefined}
            onChange={(selectedDates) => {
              if (selectedDates.length > 0) {
                const date = selectedDates[0];
                const formattedDate = date.toISOString().split("T")[0];
                handleInputChange("created_at_start", formattedDate);
              }
            }}
          />
        </div>

        <div>
          <DatePicker
            id="comment-date-end"
            label="Ngày comment (đến)"
            placeholder="Chọn ngày kết thúc"
            defaultDate={filters.created_at_end || undefined}
            onChange={(selectedDates) => {
              if (selectedDates.length > 0) {
                const date = selectedDates[0];
                const formattedDate = date.toISOString().split("T")[0];
                handleInputChange("created_at_end", formattedDate);
              }
            }}
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

export default CommentSearchForm;
