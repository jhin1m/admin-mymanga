import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import { MangaViewsTables } from "@/components/dashboard/MangaViewsTables";
import React from "react";

export const metadata: Metadata = {
  title:
    "MyManga VN Admin Dashboard | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Admin Dashboard for MyManga VN",
};

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <EcommerceMetrics />
      <MangaViewsTables />
    </div>
  );
}