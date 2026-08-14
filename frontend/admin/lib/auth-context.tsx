"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, clearToken, type Admin } from "./api-client";

type AuthState = {
  admin: Admin | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = useCallback(async () => {
    if (!getToken()) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await api.profile();
      if (profile.role !== "admin") {
        clearToken();
        setAdmin(null);
      } else {
        setAdmin(profile);
      }
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore session on mount
    refreshProfile();
  }, [refreshProfile]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // token may already be invalid — clear locally regardless
    }
    clearToken();
    setAdmin(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ admin, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
