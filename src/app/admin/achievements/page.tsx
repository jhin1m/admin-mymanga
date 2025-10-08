"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AchievementSearchForm from "@/components/form/AchievementSearchForm";
import AchievementsTable from "@/components/tables/AchievementsTable";
import { useState } from "react";

interface SearchFilters {
  name: string;
}

export default function AchievementsPage() {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    name: "",
  });

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  const handleReset = () => {
    setSearchFilters({
      name: "",
    });
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Danh hiệu" />
      <div className="space-y-6">
        <ComponentCard title="Tìm kiếm và Lọc">
          <AchievementSearchForm onSearch={handleSearch} onReset={handleReset} />
        </ComponentCard>

        <ComponentCard title="Danh sách Danh hiệu">
          <AchievementsTable searchFilters={searchFilters} />
        </ComponentCard>
      </div>
    </div>
  );
}
