"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PinEntry } from "@/components/pin/pin-entry";
import { api, ApiError } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/language-context";

export default function ChangePinPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [step, setStep] = useState<"old" | "new">("old");
  const [oldPin, setOldPin] = useState("");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestChange = async (pin: string) => {
    setError(null);
    setLoading(true);
    try {
      await api.requestPinChange({ old_pin: pin });
      setStep("new");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("errors.connectionError"));
      setOldPin("");
    } finally {
      setLoading(false);
    }
  };

  const confirmChange = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.confirmPinChange({ otp, new_pin: newPin });
      toast.success(t("common.done"));
      router.push("/profile");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("errors.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/profile" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("nav.profile")}
      </Link>

      <h1 className="text-xl font-semibold">{t("profile.changePin")}</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === "old" ? (
        <div className="space-y-4">
          <Label className="block text-center">Current PIN</Label>
          <PinEntry value={oldPin} onChange={setOldPin} onComplete={requestChange} disabled={loading} error={!!error} autoFocus />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="block text-center">{t("otp.title")}</Label>
            <PinEntry length={6} masked={false} value={otp} onChange={setOtp} disabled={loading} autoFocus />
          </div>
          <div className="space-y-2">
            <Label className="block text-center">{t("register.confirmPin")}</Label>
            <PinEntry value={newPin} onChange={setNewPin} disabled={loading} />
          </div>
          <Button
            className="h-12 w-full"
            disabled={loading || otp.length !== 6 || newPin.length !== 4}
            onClick={confirmChange}
          >
            {loading ? t("common.loading") : t("common.confirm")}
          </Button>
        </div>
      )}
    </div>
  );
}
