"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/lib/settings-context";
import { useLanguage } from "@/lib/i18n/language-context";

export default function PrivacyPage() {
  const { t } = useLanguage();
  const { hideBalance, setHideBalance } = useSettings();

  return (
    <div className="space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("settings.title")}
      </Link>

      <h1 className="text-xl font-semibold">{t("settings.privacy")}</h1>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <span className="text-sm font-medium">{t("settings.hideBalance")}</span>
        <Switch checked={hideBalance} onCheckedChange={setHideBalance} />
      </div>

      <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
        Your full name, phone number, email address, and a hashed PIN are stored to run your
        account. Card and crypto payment details use PayCam-owned test data only — this is a
        sandbox environment.
      </div>

      <Link href="/legal" className="text-sm text-primary underline">
        {t("welcome.privacyPolicy")}
      </Link>
    </div>
  );
}
