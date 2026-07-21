"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, setToken, clearToken, type Merchant } from "./api-client";

type AuthState = {
  merchant: Merchant | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = useCallback(async () => {
    if (!getToken()) {
      setMerchant(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await api.profile();
      setMerchant(profile);
    } catch {
      setMerchant(null);
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
    setMerchant(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ merchant, loading, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { setToken };
