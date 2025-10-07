"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DoujinshiSearchForm from "@/components/form/DoujinshiSearchForm";
import DoujinshisTable from "@/components/tables/DoujinshisTable";
import { useState } from "react";

interface SearchFilters {
  name: string;
}

export default function DoujinshisPage() {
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
      <PageBreadcrumb pageTitle="Doujinshi" />
      <div className="space-y-6">
        <ComponentCard title="Tìm kiếm và Lọc">
          <DoujinshiSearchForm onSearch={handleSearch} onReset={handleReset} />
        </ComponentCard>

        <ComponentCard title="Danh sách Doujinshi">
          <DoujinshisTable searchFilters={searchFilters} />
        </ComponentCard>
      </div>
    </div>
  );
}
