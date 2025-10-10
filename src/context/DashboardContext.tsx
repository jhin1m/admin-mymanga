"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import { apiService, type BasicStats } from "@/services/api";
import { useAuth } from "./AuthContext";

interface Manga {
  id: number;
  name: string;
  views?: number;
  views_day?: number;
  views_week?: number;
  cover_image?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface DashboardContextType {
  // Data
  basicStats: BasicStats | null;
  mangasTotal: Manga[];
  mangasDay: Manga[];
  mangasWeek: Manga[];

  // Loading states
  isLoadingStats: boolean;
  isLoadingMangas: boolean;

  // Error states
  statsError: string | null;
  mangasError: string | null;

  // Methods
  fetchBasicStats: () => Promise<void>;
  fetchMangaStats: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  clearCache: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Check if cache is still valid
const isCacheValid = <T,>(cache: CacheEntry<T> | null): boolean => {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_TTL;
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();

  // Cache storage
  const [basicStatsCache, setBasicStatsCache] = useState<CacheEntry<BasicStats> | null>(null);
  const [mangaStatsCache, setMangaStatsCache] = useState<CacheEntry<{
    total: Manga[];
    day: Manga[];
    week: Manga[];
  }> | null>(null);

  // Loading states
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingMangas, setIsLoadingMangas] = useState(false);

  // Error states
  const [statsError, setStatsError] = useState<string | null>(null);
  const [mangasError, setMangasError] = useState<string | null>(null);

  // Fetch basic statistics
  const fetchBasicStats = useCallback(async () => {
    // Return cached data if valid
    if (isCacheValid(basicStatsCache)) {
      return;
    }

    if (!token) {
      setStatsError("No authentication token");
      return;
    }

    setIsLoadingStats(true);
    setStatsError(null);

    try {
      const response = await apiService.getBasicStats(token);

      if (response.success && response.data) {
        setBasicStatsCache({
          data: response.data,
          timestamp: Date.now(),
        });
      } else {
        setStatsError(response.message || "Failed to fetch statistics");
      }
    } catch (err: unknown) {
      setStatsError(err instanceof Error ? err.message : "An error occurred while fetching statistics");
      console.error("Error fetching basic stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [token, basicStatsCache]);

  // Fetch manga statistics
  const fetchMangaStats = useCallback(async () => {
    // Return cached data if valid
    if (isCacheValid(mangaStatsCache)) {
      return;
    }

    if (!token) {
      setMangasError("No authentication token");
      return;
    }

    setIsLoadingMangas(true);
    setMangasError(null);

    try {
      // Fetch all 3 manga lists in parallel
      const [totalResponse, dayResponse, weekResponse] = await Promise.all([
        apiService.getMangas(token, {
          page: 1,
          per_page: 10,
          sort: "-views",
        }),
        apiService.getMangas(token, {
          page: 1,
          per_page: 10,
          sort: "-views_day",
        }),
        apiService.getMangas(token, {
          page: 1,
          per_page: 10,
          sort: "-views_week",
        }),
      ]);

      // Process responses
      const totalData = totalResponse.success && totalResponse.data
        ? (Array.isArray(totalResponse.data) ? totalResponse.data : [])
        : [];

      const dayData = dayResponse.success && dayResponse.data
        ? (Array.isArray(dayResponse.data) ? dayResponse.data : [])
        : [];

      const weekData = weekResponse.success && weekResponse.data
        ? (Array.isArray(weekResponse.data) ? weekResponse.data : [])
        : [];

      setMangaStatsCache({
        data: {
          total: totalData,
          day: dayData,
          week: weekData,
        },
        timestamp: Date.now(),
      });
    } catch (err: unknown) {
      setMangasError(err instanceof Error ? err.message : "An error occurred while fetching manga statistics");
      console.error("Error fetching manga stats:", err);
    } finally {
      setIsLoadingMangas(false);
    }
  }, [token, mangaStatsCache]);

  // Refresh all dashboard data (force reload)
  const refreshDashboard = useCallback(async () => {
    // Clear cache to force refresh
    setBasicStatsCache(null);
    setMangaStatsCache(null);

    // Fetch fresh data
    await Promise.all([
      fetchBasicStats(),
      fetchMangaStats(),
    ]);
  }, [fetchBasicStats, fetchMangaStats]);

  // Clear all cache
  const clearCache = useCallback(() => {
    setBasicStatsCache(null);
    setMangaStatsCache(null);
  }, []);

  const value: DashboardContextType = {
    // Data
    basicStats: basicStatsCache?.data || null,
    mangasTotal: mangaStatsCache?.data.total || [],
    mangasDay: mangaStatsCache?.data.day || [],
    mangasWeek: mangaStatsCache?.data.week || [],

    // Loading states
    isLoadingStats,
    isLoadingMangas,

    // Error states
    statsError,
    mangasError,

    // Methods
    fetchBasicStats,
    fetchMangaStats,
    refreshDashboard,
    clearCache,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

// Custom hook to use dashboard context
export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
