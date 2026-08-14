"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PinEntry } from "@/components/pin/pin-entry";
import { api, ApiError } from "@/lib/api-client";
import { normalizePhone } from "@/lib/phone";
import { useLanguage } from "@/lib/i18n/language-context";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pin.length !== 4 || confirmPin.length !== 4) {
      setError(t("common.genericError"));
      return;
    }
    if (pin !== confirmPin) {
      setError(t("register.pinMismatch"));
      return;
    }
    const phoneNumber = normalizePhone(phone);
    setLoading(true);
    try {
      const res = await api.register({ phone_number: phoneNumber, full_name: fullName, pin, email });
      router.push(
        `/register/verify?phone=${encodeURIComponent(phoneNumber)}&expires=${res.expires_in_seconds}`
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("errors.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("register.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("register.subtitle")}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">{t("register.fullName")}</Label>
          <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{t("register.phoneNumber")}</Label>
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
          <Label htmlFor="email">{t("register.emailAddress")}</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-center block">{t("register.createPin")}</Label>
          <PinEntry value={pin} onChange={setPin} disabled={loading} />
        </div>
        <div className="space-y-2">
          <Label className="text-center block">{t("register.confirmPin")}</Label>
          <PinEntry value={confirmPin} onChange={setConfirmPin} disabled={loading} />
        </div>
        <p className="text-center text-xs text-muted-foreground">{t("register.dataEncryptedNotice")}</p>
        <Button type="submit" className="h-14 w-full text-base" disabled={loading}>
          {loading ? t("register.submitLoading") : t("register.submit")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("register.alreadyHaveAccountPrefix")}
        <Link href="/login" className="text-primary underline">
          {t("register.signIn")}
        </Link>
      </p>
    </div>
  );
}
