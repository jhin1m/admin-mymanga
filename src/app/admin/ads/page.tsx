"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AdSearchForm from "@/components/form/AdSearchForm";
import AdsTable from "@/components/tables/AdsTable";
import { useState } from "react";

interface SearchFilters {
  name: string;
  type: string;
  location: string;
  position: string;
  is_active: string;
}

export default function AdsPage() {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    name: "",
    type: "",
    location: "",
    position: "",
    is_active: "",
  });

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  const handleReset = () => {
    setSearchFilters({
      name: "",
      type: "",
      location: "",
      position: "",
      is_active: "",
    });
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Quảng cáo" />
      <div className="space-y-6">
        <ComponentCard title="Tìm kiếm và Lọc">
          <AdSearchForm onSearch={handleSearch} onReset={handleReset} />
        </ComponentCard>

        <ComponentCard title="Danh sách Quảng cáo">
          <AdsTable searchFilters={searchFilters} />
        </ComponentCard>
      </div>
    </div>
  );
}
