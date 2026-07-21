"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, ApiError, setToken } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/language-context";

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { t } = useLanguage();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ access_token: string; totp_secret: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(t("acceptInvite.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await api.acceptInvite({ token, password });
      setResult({ access_token: res.access_token, totp_secret: res.totp_secret });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("acceptInvite.invalidToken"));
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!result) return;
    setToken(result.access_token);
    router.push("/dashboard");
  };

  if (!token) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("acceptInvite.missingToken")}</AlertDescription>
      </Alert>
    );
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{t("acceptInvite.totpTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("acceptInvite.totpBody")}</p>
        </div>
        <div className="space-y-2">
          <Label>{t("acceptInvite.setupKeyLabel")}</Label>
          <div className="flex gap-2">
            <Input readOnly value={result.totp_secret} className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(result.totp_secret);
                toast.success(t("acceptInvite.totpCopied"));
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button className="w-full" onClick={handleContinue}>
          {t("acceptInvite.continueButton")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("acceptInvite.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("acceptInvite.subtitle")}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t("acceptInvite.password")}</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t("acceptInvite.passwordHint")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">{t("acceptInvite.confirmPassword")}</Label>
          <Input
            id="confirm-password"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("acceptInvite.submitLoading") : t("acceptInvite.submit")}
        </Button>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  );
}
