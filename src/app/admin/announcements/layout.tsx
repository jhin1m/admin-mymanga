import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function AnnouncementsLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
