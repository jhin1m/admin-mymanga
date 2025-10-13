import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý Chapter lỗi | MyManga VN Admin",
  description: "Trang quản lý Chapter lỗi - MyManga VN Admin Dashboard",
};

interface ChapterReportsLayoutProps {
  children: React.ReactNode;
}

export default function ChapterReportsLayout({ children }: ChapterReportsLayoutProps) {
  return <>{children}</>;
}