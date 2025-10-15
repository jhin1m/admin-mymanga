"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import {
  apiService,
  type ChapterReport,
  type ChapterReportStatistics,
  type ChapterReportUser,
  type ChapterReportManga,
  type ChapterReportChapter,
  type QueryParams
} from "@/services/api";
import { useAuth } from "./AuthContext";

interface EnrichedChapterReport extends ChapterReport {
  enrichedUser?: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  enrichedManga?: {
    id: string;
    name: string;
    cover?: string;
  };
  enrichedChapter?: {
    id: string;
    name: string;
  };
}

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
  reports: EnrichedChapterReport[];
  pagination: PaginationData;
  filters: SearchFilters;
}

interface ChapterReportsContextType {
  // Data
  reports: EnrichedChapterReport[];
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

  // Cache utilities
  getUserFromCache: (userId: string) => ChapterReportUser | null;
  getMangaFromCache: (mangaId: string) => ChapterReportManga | null;
  getChapterFromCache: (chapterId: string) => ChapterReportChapter | null;
  warmCache: (reportIds: string[]) => Promise<void>;
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
  const [usersCache, setUsersCache] = useState<Map<string, CacheEntry<ChapterReportUser>>>(new Map());
  const [mangasCache, setMangasCache] = useState<Map<string, CacheEntry<ChapterReportManga>>>(new Map());
  const [chaptersCache, setChaptersCache] = useState<Map<string, CacheEntry<ChapterReportChapter>>>(new Map());

  // Current data state
  const [currentReports, setCurrentReports] = useState<EnrichedChapterReport[]>([]);
  const [currentPagination, setCurrentPagination] = useState<PaginationData | null>(null);
  const [currentStatistics, setCurrentStatistics] = useState<ChapterReportStatistics | null>(null);

  // Loading states
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Error states
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Cache utilities
  const getUserFromCache = useCallback((userId: string): ChapterReportUser | null => {
    const cached = usersCache.get(userId) || null;
    return isCacheValid(cached) ? cached!.data : null;
  }, [usersCache]);

  const getMangaFromCache = useCallback((mangaId: string): ChapterReportManga | null => {
    const cached = mangasCache.get(mangaId) || null;
    return isCacheValid(cached) ? cached!.data : null;
  }, [mangasCache]);

  const getChapterFromCache = useCallback((chapterId: string): ChapterReportChapter | null => {
    const cached = chaptersCache.get(chapterId) || null;
    return isCacheValid(cached) ? cached!.data : null;
  }, [chaptersCache]);

  // Cache warming utility - preload commonly accessed data
  const warmCache = useCallback(async (reportIds: string[]) => {
    if (!token || reportIds.length === 0) return;

    try {
      // Extract unique user, manga, and chapter IDs from reports
      const userIds = new Set<string>();
      const mangaIds = new Set<string>();
      const chapterIds = new Set<string>();

      currentReports.forEach(report => {
        if (reportIds.includes(report.id)) {
          userIds.add(report.user_id);
          mangaIds.add(report.manga_id);
          chapterIds.add(report.chapter_id);
        }
      });

      // Warm user cache
      const uncachedUserIds = Array.from(userIds).filter(id => !getUserFromCache(id));
      if (uncachedUserIds.length > 0) {
        for (const userId of uncachedUserIds) {
          try {
            const userResponse = await apiService.getUsers(token, {
              filters: { id: userId },
              per_page: 1
            });
            if (userResponse.success && userResponse.data && Array.isArray(userResponse.data) && userResponse.data.length > 0) {
              const user = userResponse.data[0] as ChapterReportUser;
              setUsersCache(prev => new Map(prev).set(userId, {
                data: user,
                timestamp: Date.now()
              }));
            }
          } catch (error) {
            console.error(`Error warming user cache for ${userId}:`, error);
          }
        }
      }

      // Similar logic for manga and chapters would go here if needed
    } catch (error) {
      console.error("Error warming cache:", error);
    }
  }, [token, currentReports, getUserFromCache]);

  // Enrich report data with cached or fresh data
  const enrichReportData = useCallback(async (report: ChapterReport): Promise<EnrichedChapterReport> => {
    if (!token) return report as EnrichedChapterReport;

    const enriched: EnrichedChapterReport = { ...report };

    try {
      // Try to get user from cache first
      let user = getUserFromCache(report.user_id);
      if (!user) {
        const userResponse = await apiService.getUsers(token, {
          filters: { id: report.user_id },
          per_page: 1
        });
        if (userResponse.success && userResponse.data && Array.isArray(userResponse.data) && userResponse.data.length > 0) {
          user = userResponse.data[0] as ChapterReportUser;
          // Cache the user
          setUsersCache(prev => new Map(prev).set(report.user_id, {
            data: user!,
            timestamp: Date.now()
          }));
        }
      }

      if (user) {
        enriched.enrichedUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        };
      }

      // Try to get manga from cache first
      let manga = getMangaFromCache(report.manga_id);
      if (!manga) {
        const mangaResponse = await apiService.getMangaById(token, report.manga_id);
        if (mangaResponse.success && mangaResponse.data) {
          manga = mangaResponse.data as ChapterReportManga;
          // Cache the manga
          setMangasCache(prev => new Map(prev).set(report.manga_id, {
            data: manga!,
            timestamp: Date.now()
          }));
        }
      }

      if (manga) {
        enriched.enrichedManga = {
          id: manga.id,
          name: manga.name,
          cover: manga.cover
        };
      }

      // Try to get chapter from cache first
      let chapter = getChapterFromCache(report.chapter_id);
      if (!chapter) {
        const chapterResponse = await apiService.getChapters(token, {
          filters: { manga_id: report.manga_id },
          per_page: 999999,
          sort: "-order"
        });
        if (chapterResponse.success && chapterResponse.data && Array.isArray(chapterResponse.data)) {
          const chapters = chapterResponse.data as ChapterReportChapter[];
          chapter = chapters.find((ch: ChapterReportChapter) => ch.id === report.chapter_id) || null;
          if (chapter) {
            // Cache all chapters from the response
            chapters.forEach(ch => {
              setChaptersCache(prev => new Map(prev).set(ch.id, {
                data: ch,
                timestamp: Date.now()
              }));
            });
          }
        }
      }

      if (chapter) {
        enriched.enrichedChapter = {
          id: chapter.id,
          name: chapter.name
        };
      }
    } catch (error) {
      console.error("Error enriching report data:", error);
    }

    return enriched;
  }, [token, getUserFromCache, getMangaFromCache, getChapterFromCache]);

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
        // Enrich each report with additional data
        const enrichedReports = await Promise.all(
          response.data.map(report => enrichReportData(report))
        );

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
          count: responseData.pagination?.count || enrichedReports.length,
          total: responseData.pagination?.total || enrichedReports.length,
          perPage: responseData.pagination?.perPage || 20,
          currentPage: responseData.pagination?.currentPage || page,
          totalPages: responseData.pagination?.totalPages || 1,
        };

        // Cache the results
        const cacheData: ReportsListCache = {
          reports: enrichedReports,
          pagination,
          filters: normalizedFilters
        };

        setReportsCache(prev => new Map(prev).set(cacheKey, {
          data: cacheData,
          timestamp: Date.now()
        }));

        setCurrentReports(enrichedReports);
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
  }, [token, reportsCache, enrichReportData]);

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
    setUsersCache(new Map());
    setMangasCache(new Map());
    setChaptersCache(new Map());

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
    setUsersCache(new Map());
    setMangasCache(new Map());
    setChaptersCache(new Map());
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

    // Cache utilities
    getUserFromCache,
    getMangaFromCache,
    getChapterFromCache,
    warmCache,
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