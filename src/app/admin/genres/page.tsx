"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import GenreSearchForm from "@/components/form/GenreSearchForm";
import GenresTable from "@/components/tables/GenresTable";
import { useState } from "react";

interface SearchFilters {
  name: string;
}

export default function GenresPage() {
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
      <PageBreadcrumb pageTitle="Thể loại" />
      <div className="space-y-6">
        <ComponentCard title="Tìm kiếm và Lọc">
          <GenreSearchForm onSearch={handleSearch} onReset={handleReset} />
        </ComponentCard>

        <ComponentCard title="Danh sách Thể loại">
          <GenresTable searchFilters={searchFilters} />
        </ComponentCard>
      </div>
    </div>
  );
}
