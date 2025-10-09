import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tạo chương mới | MyManga VN Admin",
  description: "Trang tạo chương - MyManga VN Admin Dashboard",
};

interface ChaptersNewLayoutProps {
  children: React.ReactNode;
}

export default function ChaptersNewLayout({ children }: ChaptersNewLayoutProps) {
  return <>{children}</>;
}