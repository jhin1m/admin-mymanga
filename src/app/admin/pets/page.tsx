"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PetSearchForm from "@/components/form/PetSearchForm";
import PetsTable from "@/components/tables/PetsTable";
import { useState } from "react";

interface SearchFilters {
  name: string;
}

export default function PetsPage() {
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
      <PageBreadcrumb pageTitle="Bạn đồng hành" />
      <div className="space-y-6">
        <ComponentCard title="Tìm kiếm và Lọc">
          <PetSearchForm onSearch={handleSearch} onReset={handleReset} />
        </ComponentCard>

        <ComponentCard title="Danh sách Bạn đồng hành">
          <PetsTable searchFilters={searchFilters} />
        </ComponentCard>
      </div>
    </div>
  );
}
