import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý thể loại | MyManga VN Admin",
  description: "Trang quản lý thể loại - MyManga VN Admin Dashboard",
};

interface GenresLayoutProps {
  children: React.ReactNode;
}

export default function GenresLayout({ children }: GenresLayoutProps) {
  return <>{children}</>;
}