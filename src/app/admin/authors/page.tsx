"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AuthorSearchForm from "@/components/form/AuthorSearchForm";
import AuthorsTable from "@/components/tables/AuthorsTable";
import { useState } from "react";

interface SearchFilters {
  name: string;
}

export default function AuthorsPage() {
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
      <PageBreadcrumb pageTitle="Tác giả" />
      <div className="space-y-6">
        <ComponentCard title="Tìm kiếm và Lọc">
          <AuthorSearchForm onSearch={handleSearch} onReset={handleReset} />
        </ComponentCard>

        <ComponentCard title="Danh sách Tác giả">
          <AuthorsTable searchFilters={searchFilters} />
        </ComponentCard>
      </div>
    </div>
  );
}
