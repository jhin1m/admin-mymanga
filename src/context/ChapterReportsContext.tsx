"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import {
  apiService,
  type ChapterReport,
  type ChapterReportStatistics,
  type QueryParams
} from "@/services/api";
import { useAuth } from "./AuthContext";

interface SearchFilters {
  report_type: string;
  user_id: string;
  sort: string;
}

interface PaginationData {
  count: number;
  total: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface ReportsListCache {
  reports: ChapterReport[];
  pagination: PaginationData;
  filters: SearchFilters;
}

interface ChapterReportsContextType {
  // Data
  reports: ChapterReport[];
  statistics: ChapterReportStatistics | null;
  pagination: PaginationData | null;

  // Loading states
  isLoadingReports: boolean;
  isLoadingStats: boolean;

  // Error states
  reportsError: string | null;
  statsError: string | null;

  // Methods
  fetchReports: (page?: number, filters?: Partial<SearchFilters>, forceRefresh?: boolean) => Promise<void>;
  fetchStatistics: (forceRefresh?: boolean) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  bulkDeleteReports: (reportIds: string[]) => Promise<void>;
  refreshData: () => Promise<void>;
  clearCache: () => void;
}

const ChapterReportsContext = createContext<ChapterReportsContextType | undefined>(undefined);

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Check if cache is still valid
const isCacheValid = <T,>(cache: CacheEntry<T> | null): boolean => {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_TTL;
};

// Generate cache key for reports list
const generateReportsKey = (page: number, filters: Partial<SearchFilters>): string => {
  return `reports_${page}_${JSON.stringify(filters)}`;
};

export const ChapterReportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();

  // Cache storage
  const [reportsCache, setReportsCache] = useState<Map<string, CacheEntry<ReportsListCache>>>(new Map());
  const [statisticsCache, setStatisticsCache] = useState<CacheEntry<ChapterReportStatistics> | null>(null);

  // Current data state
  const [currentReports, setCurrentReports] = useState<ChapterReport[]>([]);
  const [currentPagination, setCurrentPagination] = useState<PaginationData | null>(null);
  const [currentStatistics, setCurrentStatistics] = useState<ChapterReportStatistics | null>(null);

  // Loading states
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Error states
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Fetch reports with caching
  const fetchReports = useCallback(async (
    page = 1,
    filters: Partial<SearchFilters> = {},
    forceRefresh = false
  ) => {
    if (!token) return;

    const normalizedFilters: SearchFilters = {
      report_type: filters.report_type || "",
      user_id: filters.user_id || "",
      sort: filters.sort || "-created_at"
    };

    const cacheKey = generateReportsKey(page, normalizedFilters);
    const cachedData = reportsCache.get(cacheKey) || null;

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(cachedData)) {
      setCurrentReports(cachedData!.data.reports);
      setCurrentPagination(cachedData!.data.pagination);
      return;
    }

    setIsLoadingReports(true);
    setReportsError(null);

    try {
      const params: QueryParams = {
        page: page,
        per_page: 20,
        sort: normalizedFilters.sort,
      };

      // Prepare filters object for API
      const apiFilters: Record<string, string> = {};
      if (normalizedFilters.report_type && normalizedFilters.report_type.trim()) {
        apiFilters.report_type = normalizedFilters.report_type.trim();
      }
      if (normalizedFilters.user_id && normalizedFilters.user_id.trim()) {
        apiFilters.user_id = normalizedFilters.user_id.trim();
      }
      if (Object.keys(apiFilters).length > 0) {
        params.filters = apiFilters;
      }

      const response = await apiService.getChapterReports(token, params);

      if (response.success && response.data && Array.isArray(response.data)) {
        const reports = response.data as ChapterReport[];

        const responseData = response as {
          success: boolean;
          data: ChapterReport[];
          pagination?: {
            count: number;
            total: number;
            perPage: number;
            currentPage: number;
            totalPages: number;
          };
          message?: string;
          code: number;
        };

        const pagination: PaginationData = {
          count: responseData.pagination?.count || reports.length,
          total: responseData.pagination?.total || reports.length,
          perPage: responseData.pagination?.perPage || 20,
          currentPage: responseData.pagination?.currentPage || page,
          totalPages: responseData.pagination?.totalPages || 1,
        };

        // Cache the results
        const cacheData: ReportsListCache = {
          reports,
          pagination,
          filters: normalizedFilters
        };

        setReportsCache(prev => new Map(prev).set(cacheKey, {
          data: cacheData,
          timestamp: Date.now()
        }));

        setCurrentReports(reports);
        setCurrentPagination(pagination);
      } else {
        setReportsError(response.message || "Failed to fetch reports");
      }
    } catch (error) {
      console.error("Error fetching chapter reports:", error);
      setReportsError("Có lỗi xảy ra khi tải báo cáo");
    } finally {
      setIsLoadingReports(false);
    }
  }, [token, reportsCache]);

  // Fetch statistics with caching
  const fetchStatistics = useCallback(async (forceRefresh = false) => {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(statisticsCache)) {
      setCurrentStatistics(statisticsCache!.data);
      return;
    }

    if (!token) {
      setStatsError("No authentication token");
      return;
    }

    setIsLoadingStats(true);
    setStatsError(null);

    try {
      const response = await apiService.getChapterReportsStatistics(token);

      if (response.success && response.data) {
        setStatisticsCache({
          data: response.data,
          timestamp: Date.now(),
        });
        setCurrentStatistics(response.data);
      } else {
        setStatsError(response.message || "Failed to fetch statistics");
      }
    } catch (error) {
      console.error("Error fetching chapter reports statistics:", error);
      setStatsError("Có lỗi xảy ra khi tải thống kê");
    } finally {
      setIsLoadingStats(false);
    }
  }, [token, statisticsCache]);

  // Delete single report
  const deleteReport = useCallback(async (reportId: string) => {
    if (!token) return;

    await apiService.deleteChapterReport(token, reportId);

    // Smart cache invalidation: remove the deleted report from current data
    setCurrentReports(prev => prev.filter(report => report.id !== reportId));

    // Update pagination count
    if (currentPagination) {
      setCurrentPagination(prev => prev ? {
        ...prev,
        total: prev.total - 1,
        count: prev.count - 1
      } : null);
    }

    // Invalidate all cache to ensure consistency
    setReportsCache(new Map());
    setStatisticsCache(null);

    // Refresh statistics
    await fetchStatistics(true);
  }, [token, currentPagination, fetchStatistics]);

  // Bulk delete reports
  const bulkDeleteReports = useCallback(async (reportIds: string[]) => {
    if (!token) return;

    await apiService.bulkDeleteChapterReports(token, reportIds);

    // Smart cache invalidation: remove deleted reports from current data
    setCurrentReports(prev => prev.filter(report => !reportIds.includes(report.id)));

    // Update pagination count
    if (currentPagination) {
      setCurrentPagination(prev => prev ? {
        ...prev,
        total: prev.total - reportIds.length,
        count: prev.count - reportIds.length
      } : null);
    }

    // Invalidate all cache to ensure consistency
    setReportsCache(new Map());
    setStatisticsCache(null);

    // Refresh statistics
    await fetchStatistics(true);
  }, [token, currentPagination, fetchStatistics]);

  // Refresh all data (force reload)
  const refreshData = useCallback(async () => {
    // Clear all caches
    setReportsCache(new Map());
    setStatisticsCache(null);

    // Fetch fresh data
    await Promise.all([
      fetchReports(currentPagination?.currentPage || 1, {}, true),
      fetchStatistics(true)
    ]);
  }, [currentPagination, fetchReports, fetchStatistics]);

  // Clear all cache
  const clearCache = useCallback(() => {
    setReportsCache(new Map());
    setStatisticsCache(null);
  }, []);

  const value: ChapterReportsContextType = {
    // Data
    reports: currentReports,
    statistics: currentStatistics,
    pagination: currentPagination,

    // Loading states
    isLoadingReports,
    isLoadingStats,

    // Error states
    reportsError,
    statsError,

    // Methods
    fetchReports,
    fetchStatistics,
    deleteReport,
    bulkDeleteReports,
    refreshData,
    clearCache,
  };

  return (
    <ChapterReportsContext.Provider value={value}>
      {children}
    </ChapterReportsContext.Provider>
  );
};

// Custom hook to use chapter reports context
export const useChapterReports = (): ChapterReportsContextType => {
  const context = useContext(ChapterReportsContext);
  if (!context) {
    throw new Error("useChapterReports must be used within a ChapterReportsProvider");
  }
  return context;
};