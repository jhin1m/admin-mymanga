import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý quảng cáo | MyManga VN Admin",
  description: "Trang quản lý quảng cáo - MyManga VN Admin Dashboard",
};

interface AdsLayoutProps {
  children: React.ReactNode;
}

export default function AdsLayout({ children }: AdsLayoutProps) {
  return <>{children}</>;
}
