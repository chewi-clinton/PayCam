"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { PinEntry } from "@/components/pin/pin-entry";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { usePinRelock } from "@/lib/pin-relock-context";
import { useLanguage } from "@/lib/i18n/language-context";

export function RelockOverlay() {
  const { locked, unlock } = usePinRelock();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  if (!locked) return null;

  const verify = async (value: string) => {
    if (!user) return;
    setChecking(true);
    setError(null);
    try {
      await api.login({ phone_number: user.phone_number, pin: value });
      setPin("");
      unlock();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("errors.connectionError"));
      setPin("");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-background px-6">
      <Lock className="h-10 w-10 text-primary" />
      <div className="text-center">
        <h1 className="text-lg font-semibold">{t("login.securityPin")}</h1>
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
      <PinEntry value={pin} onChange={setPin} onComplete={verify} disabled={checking} error={!!error} autoFocus />
      <button type="button" onClick={logout} className="text-sm text-muted-foreground underline">
        {t("profile.logout")}
      </button>
    </div>
  );
}
