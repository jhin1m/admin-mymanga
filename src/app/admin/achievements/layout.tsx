import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý danh hiệu | MyManga VN Admin",
  description: "Trang quản lý danh hiệu - MyManga VN Admin Dashboard",
};

interface AchievementsLayoutProps {
  children: React.ReactNode;
}

export default function AchievementsLayout({ children }: AchievementsLayoutProps) {
  return <>{children}</>;
}