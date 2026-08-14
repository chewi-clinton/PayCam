"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "paycam_wallet_settings";

type NotificationPrefs = { push: boolean; email: boolean };

type Settings = {
  hideBalance: boolean;
  relockOnLeave: boolean;
  notificationPrefs: NotificationPrefs;
};

const DEFAULTS: Settings = {
  hideBalance: false,
  relockOnLeave: true,
  notificationPrefs: { push: true, email: true },
};

type SettingsState = Settings & {
  setHideBalance: (value: boolean) => void;
  setRelockOnLeave: (value: boolean) => void;
  setNotificationPrefs: (value: NotificationPrefs) => void;
};

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage on mount
      setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }));
    } catch {
      // ignore malformed stored settings
    }
  }, []);

  const persist = useCallback((next: Settings) => {
    setSettings(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setHideBalance = useCallback(
    (value: boolean) => persist({ ...settings, hideBalance: value }),
    [settings, persist]
  );
  const setRelockOnLeave = useCallback(
    (value: boolean) => persist({ ...settings, relockOnLeave: value }),
    [settings, persist]
  );
  const setNotificationPrefs = useCallback(
    (value: NotificationPrefs) => persist({ ...settings, notificationPrefs: value }),
    [settings, persist]
  );

  return (
    <SettingsContext.Provider value={{ ...settings, setHideBalance, setRelockOnLeave, setNotificationPrefs }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
