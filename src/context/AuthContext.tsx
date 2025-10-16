"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiService, type AdminUser, type LoginRequest } from "@/services/api";

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; message?: string; errors?: Record<string, string[]> }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  isTokenValid: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Use ref to track if we're currently checking auth to prevent duplicate checks
  const isCheckingAuth = useRef(false);
  const lastAuthCheck = useRef<number>(0);

  // Auth check interval (5 minutes)
  const AUTH_CHECK_INTERVAL = 5 * 60 * 1000;

  const isAuthenticated = !!token && !!user;

  const checkAuthWithToken = useCallback(async (authToken: string, force = false) => {
    // Prevent duplicate checks unless forced
    if (isCheckingAuth.current && !force) {
      return;
    }

    // Skip check if we recently validated (unless forced)
    const now = Date.now();
    if (!force && now - lastAuthCheck.current < AUTH_CHECK_INTERVAL) {
      setIsLoading(false);
      return;
    }

    isCheckingAuth.current = true;
    lastAuthCheck.current = now;

    try {
      const response = await apiService.getProfile(authToken);
      if (response.success && response.data) {
        setUser(response.data);
        setToken(authToken);
        localStorage.setItem("admin_token", authToken);
        // Store last validation time
        localStorage.setItem("admin_token_validated", now.toString());
      } else {
        // Token is invalid
        console.warn("Token validation failed:", response.message);
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_token_validated");
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      // Token is invalid or expired
      console.error("Auth check failed:", error);
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_token_validated");
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
      isCheckingAuth.current = false;
    }
  }, [AUTH_CHECK_INTERVAL]);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await apiService.login(credentials);

      if (response.success && response.data) {
        const { token: newToken } = response.data;

        // Get user profile with the new token
        const profileResponse = await apiService.getProfile(newToken);

        if (profileResponse.success && profileResponse.data) {
          setToken(newToken);
          setUser(profileResponse.data);
          localStorage.setItem("admin_token", newToken);
          localStorage.setItem("admin_token_validated", Date.now().toString());

          // Redirect to admin dashboard
          router.push("/admin");

          return { success: true };
        } else {
          return {
            success: false,
            message: "Failed to get user profile"
          };
        }
      } else {
        return {
          success: false,
          message: response.message || "Login failed"
        };
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Login failed",
        errors: (error as { errors?: Record<string, string[]> }).errors
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiService.logout(token);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_token_validated");
      router.push("/signin");
    }
  };

  const checkAuth = useCallback(async (force = false) => {
    if (token) {
      await checkAuthWithToken(token, force);
    }
  }, [token, checkAuthWithToken]);

  const isTokenValid = useCallback(() => {
    if (!token) return false;

    const lastValidated = localStorage.getItem("admin_token_validated");
    if (!lastValidated) return false;

    const validatedTime = parseInt(lastValidated, 10);
    const now = Date.now();

    // Consider token valid if validated within the last 5 minutes
    return (now - validatedTime) < AUTH_CHECK_INTERVAL;
  }, [token, AUTH_CHECK_INTERVAL]);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken) {
      setToken(savedToken);
      // Verify token with API - check if recently validated first
      const lastValidated = localStorage.getItem("admin_token_validated");
      const shouldForceCheck = !lastValidated ||
        (Date.now() - parseInt(lastValidated, 10)) > AUTH_CHECK_INTERVAL;

      checkAuthWithToken(savedToken, shouldForceCheck);
    } else {
      setIsLoading(false);
    }
  }, [checkAuthWithToken, AUTH_CHECK_INTERVAL]);

  // Listen for storage events to sync auth state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "admin_token") {
        if (e.newValue === null) {
          // Token was removed in another tab - logout this tab
          console.log("Token removed in another tab, logging out");
          setToken(null);
          setUser(null);
          setIsLoading(false);
          router.push("/signin");
        } else if (e.newValue && e.newValue !== token) {
          // Token was updated in another tab - update this tab
          console.log("Token updated in another tab");
          setToken(e.newValue);
          checkAuthWithToken(e.newValue, true);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [token, router, checkAuthWithToken]);

  // Listen for tab visibility changes to re-validate auth when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && token) {
        // Tab became visible and we have a token
        console.log("Tab became visible, checking auth");
        checkAuth(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [token, checkAuth]);

  // Periodic auth check when tab is active
  useEffect(() => {
    if (!token || !isAuthenticated) return;

    const interval = setInterval(() => {
      if (!document.hidden && !isTokenValid()) {
        console.log("Periodic auth check");
        checkAuth(true);
      }
    }, AUTH_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [token, isAuthenticated, isTokenValid, checkAuth, AUTH_CHECK_INTERVAL]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        logout,
        checkAuth,
        isTokenValid,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};