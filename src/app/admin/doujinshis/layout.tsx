import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý Doujinshi | MyManga VN Admin",
  description: "Trang quản lý Doujinshi - MyManga VN Admin Dashboard",
};

interface DoujinshiLayoutProps {
  children: React.ReactNode;
}

export default function DoujinshiLayout({ children }: DoujinshiLayoutProps) {
  return <>{children}</>;
}