"use client";
import React, { useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { GroupIcon, DocsIcon, PageIcon, BoxCubeIcon } from "@/icons";

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  isLoading: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, isLoading }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
      {icon}
    </div>

    <div className="mt-5">
      <div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
          {isLoading ? (
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-20 rounded"></div>
          ) : (
            value.toLocaleString()
          )}
        </h4>
      </div>
    </div>
  </div>
);

export const EcommerceMetrics = () => {
  const { basicStats, isLoadingStats, statsError, fetchBasicStats } = useDashboard();

  useEffect(() => {
    fetchBasicStats();
  }, [fetchBasicStats]);

  if (statsError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/20 md:p-6">
        <p className="text-red-600 dark:text-red-400">
          Error loading statistics: {statsError}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      <MetricCard
        title="Users"
        value={basicStats?.user_count || 0}
        icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />}
        isLoading={isLoadingStats}
      />

      <MetricCard
        title="Mangas"
        value={basicStats?.manga_count || 0}
        icon={<DocsIcon className="text-gray-800 size-6 dark:text-white/90" />}
        isLoading={isLoadingStats}
      />

      <MetricCard
        title="Chapters"
        value={basicStats?.chapter_count || 0}
        icon={<PageIcon className="text-gray-800 size-6 dark:text-white/90" />}
        isLoading={isLoadingStats}
      />

      <MetricCard
        title="Pets"
        value={basicStats?.pet_count || 0}
        icon={<BoxCubeIcon className="text-gray-800 size-6 dark:text-white/90" />}
        isLoading={isLoadingStats}
      />
    </div>
  );
};
