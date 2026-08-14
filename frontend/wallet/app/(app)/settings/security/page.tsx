"use client";

import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { MenuItem } from "@/components/common/menu-item";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/lib/settings-context";
import { useLanguage } from "@/lib/i18n/language-context";

export default function SecurityPage() {
  const { t } = useLanguage();
  const { hideBalance, setHideBalance, relockOnLeave, setRelockOnLeave } = useSettings();

  return (
    <div className="space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("settings.title")}
      </Link>

      <h1 className="text-xl font-semibold">{t("profile.security")}</h1>

      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <span className="text-sm font-medium">{t("settings.relockOnLeave")}</span>
          <Switch checked={relockOnLeave} onCheckedChange={setRelockOnLeave} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <span className="text-sm font-medium">{t("settings.hideBalance")}</span>
          <Switch checked={hideBalance} onCheckedChange={setHideBalance} />
        </div>
        <MenuItem href="/profile/change-pin" icon={KeyRound} title={t("profile.changePin")} />
      </div>
    </div>
  );
}
