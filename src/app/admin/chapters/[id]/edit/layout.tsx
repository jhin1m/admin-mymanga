import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý chương | MyManga VN Admin",
  description: "Trang quản lý chương - MyManga VN Admin Dashboard",
};

interface ChaptersLayoutProps {
  children: React.ReactNode;
}

export default function ChaptersLayout({ children }: ChaptersLayoutProps) {
  return <>{children}</>;
}