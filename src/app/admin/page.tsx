import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";

export const metadata: Metadata = {
  title:
    "MyManga VN Admin Dashboard | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Admin Dashboard for MyManga VN",
};

export default function AdminDashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-12">
        <EcommerceMetrics />
      </div>
    </div>
  );
}