"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, clearToken, type MobileAppUser, type Wallet, type CryptoWallet } from "./api-client";

type AuthState = {
  user: MobileAppUser | null;
  wallet: Wallet | null;
  cryptoWallets: CryptoWallet[];
  loading: boolean;
  refreshWallet: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileAppUser | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshWallet = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setWallet(null);
      setCryptoWallets([]);
      setLoading(false);
      return;
    }
    try {
      const data = await api.wallet();
      setUser(data.user);
      setWallet(data.wallet);
      setCryptoWallets(data.crypto_wallets);
    } catch {
      setUser(null);
      setWallet(null);
      setCryptoWallets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore session on mount
    refreshWallet();
  }, [refreshWallet]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setWallet(null);
    setCryptoWallets([]);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, wallet, cryptoWallets, loading, refreshWallet, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
