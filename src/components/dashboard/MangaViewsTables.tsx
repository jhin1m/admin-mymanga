"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { useDashboard } from "@/context/DashboardContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

interface Manga {
  id: number;
  name: string;
  views?: number;
  views_day?: number;
  views_week?: number;
  cover_image?: string;
}

interface MangaTableProps {
  title: string;
  mangas: Manga[];
  isLoading: boolean;
  viewType: "total" | "day" | "week";
}

const MangaTable: React.FC<MangaTableProps> = ({
  title,
  mangas,
  isLoading,
  viewType,
}) => {
  const getViewCount = (manga: Manga) => {
    switch (viewType) {
      case "day":
        return manga.views_day || 0;
      case "week":
        return manga.views_week || 0;
      default:
        return manga.views || 0;
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
          {title}
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  #
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  Tên Manga
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-end text-xs dark:text-gray-400"
                >
                  Lượt xem
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading ? (
                // Loading skeleton
                [...Array(10)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-5 py-4">
                      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-6 rounded"></div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-48 rounded"></div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-end">
                      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-16 rounded ml-auto"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : mangas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="px-5 py-8 text-center">
                    <span className="text-gray-500 dark:text-gray-400">
                      Không có dữ liệu
                    </span>
                  </TableCell>
                </TableRow>
              ) : (
                mangas.map((manga, index) => (
                  <TableRow key={manga.id}>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="text-gray-800 dark:text-white/90 font-medium">
                        {index + 1}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <Link
                        href={`/admin/mangas/${manga.id}/edit`}
                        className="text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 hover:underline font-medium transition-colors"
                      >
                        {manga.name}
                      </Link>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-end">
                      <span className="text-gray-800 dark:text-white/90 font-semibold">
                        {getViewCount(manga).toLocaleString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export const MangaViewsTables = () => {
  const {
    mangasTotal,
    mangasDay,
    mangasWeek,
    isLoadingMangas,
    mangasError,
    fetchMangaStats
  } = useDashboard();

  useEffect(() => {
    fetchMangaStats();
  }, [fetchMangaStats]);

  if (mangasError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/20 md:p-6">
        <p className="text-red-600 dark:text-red-400">
          Lỗi tải thống kê manga: {mangasError}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <MangaTable
        title="Top 10 Manga - Lượt xem tổng"
        mangas={mangasTotal}
        isLoading={isLoadingMangas}
        viewType="total"
      />
      <MangaTable
        title="Top 10 Manga - Lượt xem trong ngày"
        mangas={mangasDay}
        isLoading={isLoadingMangas}
        viewType="day"
      />
      <MangaTable
        title="Top 10 Manga - Lượt xem trong tuần"
        mangas={mangasWeek}
        isLoading={isLoadingMangas}
        viewType="week"
      />
    </div>
  );
};
