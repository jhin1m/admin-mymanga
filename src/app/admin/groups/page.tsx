"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import GroupSearchForm from "@/components/form/GroupSearchForm";
import GroupsTable from "@/components/tables/GroupsTable";
import { useState } from "react";

interface SearchFilters {
  name: string;
}

export default function GroupsPage() {
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
      <PageBreadcrumb pageTitle="Nhóm dịch" />
      <div className="space-y-6">
        <ComponentCard title="Tìm kiếm và Lọc">
          <GroupSearchForm onSearch={handleSearch} onReset={handleReset} />
        </ComponentCard>

        <ComponentCard title="Danh sách Nhóm dịch">
          <GroupsTable searchFilters={searchFilters} />
        </ComponentCard>
      </div>
    </div>
  );
}
