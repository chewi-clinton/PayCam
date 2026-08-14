"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QrDisplay } from "@/components/qr/qr-display";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";
import { monoNumeric } from "@/lib/format";
import { shareText } from "@/lib/share";

export default function ReceivePage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const qrValue = JSON.stringify({ type: "paycam_receive", phone_number: user?.phone_number });

  return (
    <div className="space-y-6">
      <Link href="/home" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("nav.home")}
      </Link>

      <div className="text-center">
        <h1 className="text-xl font-semibold">{t("receive.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("receive.shareToReceive")}</p>
      </div>

      <QrDisplay value={qrValue} />

      <div className="text-center">
        <p className="text-xs text-muted-foreground">{t("receive.yourPaycamNumber")}</p>
        <p className={`mt-1 text-lg font-semibold ${monoNumeric}`}>{user?.phone_number}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          className="h-12 w-full gap-2"
          onClick={async () => {
            const result = await shareText("PayCam", user?.phone_number ?? "");
            if (result === "copied") toast.success(t("common.copied"));
          }}
        >
          <Share2 className="h-4 w-4" />
          {t("receive.shareCode")}
        </Button>
        <Button
          variant="outline"
          className="h-12 w-full gap-2"
          onClick={async () => {
            await navigator.clipboard.writeText(user?.phone_number ?? "");
            toast.success(t("common.copied"));
          }}
        >
          <Copy className="h-4 w-4" />
          {t("receive.copyNumber")}
        </Button>
      </div>
    </div>
  );
}
