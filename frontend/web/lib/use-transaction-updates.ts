"use client";

import { useEffect, useRef } from "react";
import { wsUrl } from "./api-client";

export type TransactionUpdate = {
  reference: string;
  status: string;
  amount: string;
  currency: string;
  payment_method: string;
  updated_at: string;
};

/**
 * Connects to the merchant dashboard WebSocket (apps.dashboard.consumers on
 * the backend) and calls onUpdate for every transaction.update event. Retries
 * with backoff on disconnect since merchants may leave a tab open for hours.
 */
export function useTransactionUpdates(onUpdate: (update: TransactionUpdate) => void) {
  const handlerRef = useRef(onUpdate);

  useEffect(() => {
    handlerRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let closedByEffect = false;
    let attempt = 0;

    const connect = () => {
      socket = new WebSocket(wsUrl());

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as TransactionUpdate;
          handlerRef.current(data);
        } catch {
          // ignore malformed frames
        }
      };

      socket.onclose = () => {
        if (closedByEffect) return;
        attempt += 1;
        const delay = Math.min(1000 * 2 ** attempt, 30000);
        retryTimeout = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closedByEffect = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      socket?.close();
    };
  }, []);
}
