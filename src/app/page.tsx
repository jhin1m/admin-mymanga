"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Redirect to admin dashboard if already authenticated
      router.push("/admin");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to admin
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            MyManga VN
          </h1>
          <h2 className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Admin Dashboard
          </h2>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Admin Access Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please sign in to access the MyManga VN admin dashboard.
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href="/signin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Sign In to Admin Panel
              </Link>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Need an account?{" "}
                  <Link
                    href="/signup"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Sign up here
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              This is the administrative interface for MyManga VN.
              <br />
              Only authorized administrators can access this system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}