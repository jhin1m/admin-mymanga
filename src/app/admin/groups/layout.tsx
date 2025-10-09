import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý nhóm | MyManga VN Admin",
  description: "Trang quản lý nhóm - MyManga VN Admin Dashboard",
};

interface GroupsLayoutProps {
  children: React.ReactNode;
}

export default function GroupsLayout({ children }: GroupsLayoutProps) {
  return <>{children}</>;
}