import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý bình luận | MyManga VN Admin",
  description: "Trang quản lý bình luận - MyManga VN Admin Dashboard",
};

interface CommentsLayoutProps {
  children: React.ReactNode;
}

export default function CommentsLayout({ children }: CommentsLayoutProps) {
  return <>{children}</>;
}