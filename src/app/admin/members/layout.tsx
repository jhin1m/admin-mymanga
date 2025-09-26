import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý Thành viên | MyManga VN Admin",
  description: "Trang quản lý thành viên - MyManga VN Admin Dashboard",
};

interface MembersLayoutProps {
  children: React.ReactNode;
}

export default function MembersLayout({ children }: MembersLayoutProps) {
  return <>{children}</>;
}