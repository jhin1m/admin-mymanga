"use client";
import React, { useState, useCallback } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import ChapterReportSearchForm from "@/components/form/ChapterReportSearchForm";
import ChapterReportsTable from "@/components/tables/ChapterReportsTable";
import ChapterReportsStats from "@/components/ui/ChapterReportsStats";
import { ChapterReportsProvider } from "@/context/ChapterReportsContext";

interface SearchFilters {
  report_type: string;
  user_id: string;
  sort: string;
}

function ChapterReportsPageContent() {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    report_type: "",
    user_id: "",
    sort: "-created_at",
  });

  const [refreshStatsKey, setRefreshStatsKey] = useState(0);

  const handleSearch = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
  }, []);

  const handleReset = useCallback(() => {
    setSearchFilters({
      report_type: "",
      user_id: "",
      sort: "-created_at",
    });
  }, []);

  const handleRefreshStats = useCallback(() => {
    setRefreshStatsKey(prev => prev + 1);
  }, []);

  return (
    <div>
      <PageBreadcrumb pageTitle="Báo lỗi Chapter" />

      <div className="space-y-6">
        {/* Statistics */}
        <ChapterReportsStats key={refreshStatsKey} />

        {/* Search Form */}
        <ChapterReportSearchForm
          onSearch={handleSearch}
          onReset={handleReset}
        />

        {/* Reports Table */}
        <ComponentCard title="Danh sách báo lỗi">
          <ChapterReportsTable
            searchFilters={searchFilters}
            onRefreshStats={handleRefreshStats}
          />
        </ComponentCard>
      </div>
    </div>
  );
}

export default function ChapterReportsPage() {
  return (
    <ChapterReportsProvider>
      <ChapterReportsPageContent />
    </ChapterReportsProvider>
  );
}