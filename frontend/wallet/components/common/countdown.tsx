"use client";

import { useEffect, useState } from "react";
import { monoNumeric } from "@/lib/format";

function secondsUntil(iso: string): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

/** Renders a live mm:ss countdown to `expiresAt`, calling onExpire once when it hits zero. */
export function Countdown({
  expiresAt,
  onExpire,
  className,
}: {
  expiresAt: string;
  onExpire?: () => void;
  className?: string;
}) {
  const [seconds, setSeconds] = useState(() => secondsUntil(expiresAt));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resync when expiresAt changes for a reused instance
    setSeconds(secondsUntil(expiresAt));
    const id = setInterval(() => setSeconds(secondsUntil(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  useEffect(() => {
    if (seconds === 0) onExpire?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire only on the seconds-hits-zero transition
  }, [seconds === 0]);

  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <span className={`${monoNumeric} ${className ?? ""}`}>
      {mm}:{ss}
    </span>
  );
}
