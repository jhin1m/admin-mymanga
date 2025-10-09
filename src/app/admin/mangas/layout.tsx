import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý manga | MyManga VN Admin",
  description: "Trang quản lý manga - MyManga VN Admin Dashboard",
};

interface MangasLayoutProps {
  children: React.ReactNode;
}

export default function MangasLayout({ children }: MangasLayoutProps) {
  return <>{children}</>;
}