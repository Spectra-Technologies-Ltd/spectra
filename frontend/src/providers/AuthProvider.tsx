"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Routes reachable without a session. /badge is the guards' tap surface —
  // guards have no accounts and never sign in.
  const publicPaths = ["/login", "/register", "/request-demo", "/badge"];
  const isPublicPath = publicPaths.includes(pathname || "");

  useEffect(() => {
    // Never probe /auth/me on a public route: its 401 would run the api
    // client's refresh interceptor and redirect the visitor to /login.
    if (isPublicPath) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Try to fetch current user — httpOnly cookie is sent automatically
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [isPublicPath]);

  useEffect(() => {
    if (isLoading) return;

    // Only guard private routes — let authenticated users view the auth pages
    // so they can always sign in or create an account from the same place.
    if (!user && !isPublicPath) {
      router.push("/login");
    }
  }, [user, pathname, isLoading, router, isPublicPath]);

  const login = (newUser: User) => {
    setUser(newUser);
    router.push("/");
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if logout API fails, clear local state
    }
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
