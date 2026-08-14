"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PinEntry } from "@/components/pin/pin-entry";
import { api, ApiError, setToken } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/language-context";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const initialExpiry = Number(searchParams.get("expires") ?? 600);
  const { t } = useLanguage();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(initialExpiry);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const submit = async (code: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.verifyRegistrationOtp({ phone_number: phone, otp: code });
      setToken(res.token);
      router.push("/home");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("errors.connectionError"));
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{t("otp.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("otp.subtitle")}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PinEntry
        length={6}
        masked={false}
        value={otp}
        onChange={setOtp}
        onComplete={submit}
        disabled={loading}
        error={!!error}
        autoFocus
      />

      <p className="text-center text-sm text-muted-foreground">
        {secondsLeft > 0 ? (
          <>
            {t("otp.didntReceiveCode")} {mm}:{ss}
          </>
        ) : (
          <>
            {t("otp.didntReceiveCode")}{" "}
            <Link href="/register" className="text-primary underline">
              {t("otp.resendCode")}
            </Link>
          </>
        )}
      </p>

      <Button
        type="button"
        variant="outline"
        className="h-12 w-full"
        disabled={loading || otp.length !== 6}
        onClick={() => submit(otp)}
      >
        {loading ? t("otp.verifyLoading") : t("otp.verify")}
      </Button>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}
