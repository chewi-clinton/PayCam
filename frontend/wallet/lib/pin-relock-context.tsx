"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./auth-context";
import { useSettings } from "./settings-context";

const INACTIVITY_MS = 5 * 60_000;

type PinRelockState = { locked: boolean; unlock: () => void };

const PinRelockContext = createContext<PinRelockState>({ locked: false, unlock: () => {} });

export function PinRelockProvider({ children }: { children: React.ReactNode }) {
  const { relockOnLeave } = useSettings();
  const { user } = useAuth();
  const [locked, setLocked] = useState(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (!relockOnLeave) return;
    inactivityTimer.current = setTimeout(() => setLocked(true), INACTIVITY_MS);
  }, [relockOnLeave]);

  useEffect(() => {
    if (!user) return;

    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && relockOnLeave) {
        setLocked(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    const activityEvents: (keyof DocumentEventMap)[] = ["pointerdown", "keydown", "touchstart"];
    activityEvents.forEach((evt) => document.addEventListener(evt, resetInactivityTimer));
    resetInactivityTimer();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      activityEvents.forEach((evt) => document.removeEventListener(evt, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user, relockOnLeave, resetInactivityTimer]);

  const unlock = useCallback(() => setLocked(false), []);

  return (
    <PinRelockContext.Provider value={{ locked: locked && !!user, unlock }}>{children}</PinRelockContext.Provider>
  );
}

export function usePinRelock() {
  return useContext(PinRelockContext);
}
