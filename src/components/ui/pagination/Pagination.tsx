"use client";
import React from "react";
import Button from "@/components/ui/button/Button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  total,
  perPage,
  onPageChange,
  loading = false,
}) => {
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, total);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-1 justify-between sm:hidden">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Hiển thị {startItem} đến {endItem} của {total} kết quả
          </span>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Hiển thị <span className="font-medium">{startItem}</span> đến{" "}
            <span className="font-medium">{endItem}</span> của{" "}
            <span className="font-medium">{total}</span> kết quả
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          onClick={handlePrevious}
          disabled={currentPage <= 1 || loading}
          variant="outline"
          size="sm"
        >
          Trước
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentPage >= totalPages || loading}
          variant="outline"
          size="sm"
        >
          Sau
        </Button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Hiển thị <span className="font-medium">{startItem}</span> đến{" "}
            <span className="font-medium">{endItem}</span> của{" "}
            <span className="font-medium">{total}</span> kết quả
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            onClick={handlePrevious}
            disabled={currentPage <= 1 || loading}
            variant="outline"
            size="sm"
            className="px-3 py-2"
          >
            ‹ Trước
          </Button>

          <div className="flex items-center gap-1">
            {getVisiblePages().map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`dots-${index}`}
                    className="px-3 py-2 text-sm text-gray-500"
                  >
                    ...
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  disabled={loading}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  } ${loading ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <Button
            onClick={handleNext}
            disabled={currentPage >= totalPages || loading}
            variant="outline"
            size="sm"
            className="px-3 py-2"
          >
            Sau ›
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;