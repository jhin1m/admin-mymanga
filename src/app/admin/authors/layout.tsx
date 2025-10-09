import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý tác giả | MyManga VN Admin",
  description: "Trang quản lý tác giả - MyManga VN Admin Dashboard",
};

interface AuthorsLayoutProps {
  children: React.ReactNode;
}

export default function AuthorsLayout({ children }: AuthorsLayoutProps) {
  return <>{children}</>;
}