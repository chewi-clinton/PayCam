"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PinEntry } from "@/components/pin/pin-entry";
import { api, ApiError, setToken } from "@/lib/api-client";
import { normalizePhone } from "@/lib/phone";
import { useLanguage } from "@/lib/i18n/language-context";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const phoneNumber = normalizePhone(phone);
    if (phoneNumber.length !== 12 || pin.length !== 4) {
      setError(t("common.genericError"));
      return;
    }
    setLoading(true);
    try {
      const res = await api.login({ phone_number: phoneNumber, pin });
      setToken(res.token);
      router.push("/home");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "account_locked") {
          setError(err.message);
        } else if (err.code === "invalid_pin" && err.remainingAttempts !== undefined) {
          setError(
            `${t("login.invalidPin")} ${t("login.remainingAttempts", {
              n: err.remainingAttempts,
              s: err.remainingAttempts === 1 ? "" : "s",
            })}`
          );
        } else if (err.code === "account_not_found") {
          setError(t("login.accountNotFound"));
        } else {
          setError(err.message);
        }
      } else {
        setError(t("errors.connectionError"));
      }
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{t("welcome.login")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("login.secureWalletAccess")}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="phone">{t("login.phoneNumber")}</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            required
            placeholder="237 670 000 000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-center block">{t("login.securityPin")}</Label>
          <PinEntry value={pin} onChange={setPin} error={!!error} disabled={loading} />
        </div>
        <Button type="submit" className="h-14 w-full text-base" disabled={loading}>
          {loading ? t("common.loading") : t("login.accessWallet")}
        </Button>
        <p className="text-center text-sm">
          <Link href="/forgot-pin" className="text-muted-foreground underline">
            {t("login.forgotPin")}
          </Link>
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("login.newToPaycamPrefix")}
        <Link href="/register" className="text-primary underline">
          {t("welcome.createAccount")}
        </Link>
      </p>
    </div>
  );
}
