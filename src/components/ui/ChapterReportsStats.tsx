"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ChapterReportStatistics, apiService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface ChapterReportsStatsProps {
  onRefresh?: () => void;
}

const ChapterReportsStats: React.FC<ChapterReportsStatsProps> = ({ onRefresh }) => {
  const { token } = useAuth();
  const [stats, setStats] = useState<ChapterReportStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getChapterReportsStatistics(token);
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || "Không thể tải thống kê");
      }
    } catch (err) {
      console.error("Error fetching chapter reports statistics:", err);
      setError("Có lỗi xảy ra khi tải thống kê");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [token, fetchStats]);

  useEffect(() => {
    if (onRefresh) {
      fetchStats();
    }
  }, [onRefresh, fetchStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-800 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-200">Lỗi tải thống kê</h3>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
          <button
            onClick={fetchStats}
            className="ml-auto text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Tổng báo cáo",
      value: stats.total,
      icon: "📊",
      color: "blue",
    },
    {
      title: "Báo cáo hôm nay",
      value: stats.today_reports,
      icon: "📅",
      color: "green",
    },
    {
      title: "Báo cáo gần đây",
      value: stats.recent_reports,
      icon: "🔔",
      color: "orange",
    },
  ];

  const getCardColors = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800",
          icon: "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400",
          text: "text-blue-900 dark:text-blue-100",
        };
      case "green":
        return {
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-200 dark:border-green-800",
          icon: "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400",
          text: "text-green-900 dark:text-green-100",
        };
      case "orange":
        return {
          bg: "bg-orange-50 dark:bg-orange-900/20",
          border: "border-orange-200 dark:border-orange-800",
          icon: "bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-400",
          text: "text-orange-900 dark:text-orange-100",
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-800",
          border: "border-gray-200 dark:border-gray-700",
          icon: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
          text: "text-gray-900 dark:text-gray-100",
        };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {statCards.map((card, index) => {
        const colors = getCardColors(card.color);
        return (
          <div
            key={index}
            className={`${colors.bg} ${colors.border} border rounded-xl p-6 transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${colors.text} opacity-80`}>
                  {card.title}
                </p>
                <p className={`text-3xl font-bold ${colors.text} mt-1`}>
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div className={`w-12 h-12 ${colors.icon} rounded-lg flex items-center justify-center text-xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChapterReportsStats;