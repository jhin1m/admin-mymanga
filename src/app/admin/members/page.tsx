"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import MembersSearchForm from "@/components/form/MembersSearchForm";
import MembersTable from "@/components/tables/MembersTable";
import { useState, useRef } from "react";

interface SearchFilters {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

export default function MembersPage() {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    user_id: "",
    name: "",
    email: "",
    role: "",
  });

  const tableRef = useRef<{ getLoadingState: () => boolean }>(null);

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  const handleReset = () => {
    setSearchFilters({
      user_id: "",
      name: "",
      email: "",
      role: "",
    });
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Thành viên" />
      <div className="space-y-6">
        <ComponentCard title="Tìm kiếm và Lọc">
          <MembersSearchForm
            onSearch={handleSearch}
            onReset={handleReset}
          />
        </ComponentCard>

        <ComponentCard title="Danh sách Thành viên">
          <MembersTable searchFilters={searchFilters} />
        </ComponentCard>
      </div>
    </div>
  );
}