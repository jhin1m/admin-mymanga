"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CommentSearchForm from "@/components/form/CommentSearchForm";
import CommentsTable from "@/components/tables/CommentsTable";
import { useState } from "react";

interface SearchFilters {
  username: string;
  created_at_start: string;
  created_at_end: string;
}

export default function CommentsPage() {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    username: "",
    created_at_start: "",
    created_at_end: "",
  });

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  const handleReset = () => {
    setSearchFilters({
      username: "",
      created_at_start: "",
      created_at_end: "",
    });
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Comments" />
      <div className="space-y-6">
        <ComponentCard title="Tìm kiếm và Lọc">
          <CommentSearchForm onSearch={handleSearch} onReset={handleReset} />
        </ComponentCard>

        <ComponentCard title="Danh sách Comments">
          <CommentsTable searchFilters={searchFilters} />
        </ComponentCard>
      </div>
    </div>
  );
}
