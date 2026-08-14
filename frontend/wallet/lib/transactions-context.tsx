"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, type AppTransaction } from "./api-client";

type TransactionsState = {
  transactions: AppTransaction[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const TransactionsContext = createContext<TransactionsState | null>(null);

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.transactions();
      setTransactions(res.transactions);
    } catch {
      // leave the previous cache in place on a transient failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    refresh();
  }, [refresh]);

  return (
    <TransactionsContext.Provider value={{ transactions, loading, refresh }}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error("useTransactions must be used within TransactionsProvider");
  return ctx;
}
