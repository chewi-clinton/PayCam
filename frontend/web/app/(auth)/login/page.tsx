"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, ApiError, setToken } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/language-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "1";
  const resetSuccess = searchParams.get("reset") === "1";
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({
        email,
        password,
        totp_code: needsTotp ? totpCode : undefined,
      });
      setToken(res.access_token);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.message === "2FA code required.") {
          setNeedsTotp(true);
        } else {
          setError(err.message);
        }
      } else {
        setError(t("common.genericError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("auth.login.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.login.subtitle")}</p>
      </div>

      {expired && (
        <Alert>
          <AlertDescription>{t("auth.login.sessionExpired")}</AlertDescription>
        </Alert>
      )}
      {resetSuccess && (
        <Alert>
          <AlertDescription>{t("auth.login.resetSuccess")}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.login.email")}</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.login.password")}</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              {t("auth.login.forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {needsTotp && (
          <div className="space-y-2">
            <Label htmlFor="totp">{t("auth.login.totpCode")}</Label>
            <Input
              id="totp"
              inputMode="numeric"
              maxLength={6}
              required
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="123456"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">{t("auth.login.totpHint")}</p>
          </div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("auth.login.submitLoading") : t("auth.login.submit")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.login.noAccount")}{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          {t("auth.login.signUp")}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
