"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { authApi, userApi } from "./api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "OWNER" | "CASHIER";
  tenantId: string | null;
  tenant?: { id: string; name: string; status: string; plan: string } | null;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; businessName: string; businessSlug: string }) => Promise<void>;
  logout: () => void;
  isOwner: boolean;
  isSuperAdmin: boolean;
  isCashier: boolean;
  canManage: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("pos_token");
    if (stored) {
      setToken(stored);
      userApi.me(stored).then((u) => {
        setUser(u);
        setLoading(false);
      }).catch(() => {
        localStorage.removeItem("pos_token");
        setToken(null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem("pos_token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (data: { email: string; password: string; name: string; businessName: string; businessSlug: string }) => {
    const res = await authApi.register(data);
    localStorage.setItem("pos_token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("pos_token");
    setToken(null);
    setUser(null);
  }, []);

  const isOwner = user?.role === "OWNER";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isCashier = user?.role === "CASHIER";
  const canManage = isOwner || isSuperAdmin;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isOwner, isSuperAdmin, isCashier, canManage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
