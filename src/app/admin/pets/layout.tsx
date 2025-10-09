import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý thú cưng | MyManga VN Admin",
  description: "Trang quản lý thú cưng - MyManga VN Admin Dashboard",
};

interface PetsLayoutProps {
  children: React.ReactNode;
}

export default function PetsLayout({ children }: PetsLayoutProps) {
  return <>{children}</>;
}