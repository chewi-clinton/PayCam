"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type PendingPayment } from "./api-client";

const POLL_INTERVAL_MS = 15_000;

/** Polls GET /app/payments/pending/ — the documented fallback for when push
 * notifications aren't wired up (this app doesn't register for push at all). */
export function usePendingPayments() {
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.pendingPayments();
      setPending(res.pending);
    } catch {
      // keep the previous list on a transient failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { pending, loading, refresh };
}
