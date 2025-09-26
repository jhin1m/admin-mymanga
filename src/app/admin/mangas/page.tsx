"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import MangaSearchForm from "@/components/form/MangaSearchForm";
import MangaGrid from "@/components/manga/MangaGrid";
import { useState, useRef } from "react";

interface MangaSearchFilters {
  search: string;
  group_id: string;
  user_id: string;
  artist_id: string;
  doujinshi_id: string;
  is_reviewed: string;
}

export default function MangasPage() {
  const [searchFilters, setSearchFilters] = useState<MangaSearchFilters>({
    search: "",
    group_id: "",
    user_id: "",
    artist_id: "",
    doujinshi_id: "",
    is_reviewed: "",
  });

  const gridRef = useRef<{ getLoadingState: () => boolean }>(null);

  const handleSearch = (filters: MangaSearchFilters) => {
    setSearchFilters(filters);
  };

  const handleReset = () => {
    setSearchFilters({
      search: "",
      group_id: "",
      user_id: "",
      artist_id: "",
      doujinshi_id: "",
      is_reviewed: "",
    });
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Quản lý Truyện" />
      <div className="space-y-6">
        <ComponentCard title="Tìm kiếm và Lọc">
          <MangaSearchForm
            onSearch={handleSearch}
            onReset={handleReset}
          />
        </ComponentCard>

        <ComponentCard title="Danh sách Truyện">
          <MangaGrid searchFilters={searchFilters} />
        </ComponentCard>
      </div>
    </div>
  );
}