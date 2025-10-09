import { Open_Sans } from 'next/font/google';
import './globals.css';

import { AuthProvider } from '@/context/AuthContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { DashboardProvider } from '@/context/DashboardContext';

const openSans = Open_Sans({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${openSans.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <AuthProvider>
            <DashboardProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </DashboardProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
