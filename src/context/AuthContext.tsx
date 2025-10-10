"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!token && !!user;

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken) {
      setToken(savedToken);
      // Verify token with API
      checkAuthWithToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkAuthWithToken = async (authToken: string) => {
    try {
      const response = await apiService.getProfile(authToken);
      if (response.success && response.data) {
        setUser(response.data);
        setToken(authToken);
        localStorage.setItem("admin_token", authToken);
      } else {
        // Token is invalid
        localStorage.removeItem("admin_token");
        setToken(null);
        setUser(null);
      }
    } catch {
      // Token is invalid or expired
      localStorage.removeItem("admin_token");
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

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
      router.push("/signin");
    }
  };

  const checkAuth = async () => {
    if (token) {
      await checkAuthWithToken(token);
    }
  };

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