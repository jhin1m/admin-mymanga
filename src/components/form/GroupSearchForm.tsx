"use client";
import React, { useState, useCallback, useEffect } from "react";
import Button from "@/components/ui/button/Button";

interface SearchFilters {
  name: string;
}

interface GroupSearchFormProps {
  onSearch?: (filters: SearchFilters) => void;
  onReset?: () => void;
  loading?: boolean;
}

const GroupSearchForm: React.FC<GroupSearchFormProps> = ({
  onSearch,
  onReset,
  loading = false,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    name: "",
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

  const handleInputChange = (value: string) => {
    setFilters({
      name: value,
    });
  };

  const handleSearch = useCallback(() => {
    onSearch?.(filters);
  }, [filters, onSearch]);

  const handleReset = useCallback(() => {
    const resetFilters = {
      name: "",
    };
    setFilters(resetFilters);
    setDebouncedFilters(resetFilters);
    onReset?.();
  }, [onReset]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tên nhóm dịch
          </label>
          <input
            type="text"
            value={filters.name}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Nhập tên nhóm dịch"
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
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

export default GroupSearchForm;
