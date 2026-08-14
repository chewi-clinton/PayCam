"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/lib/settings-context";
import { useLanguage } from "@/lib/i18n/language-context";

export default function NotificationPreferencesPage() {
  const { t } = useLanguage();
  const { notificationPrefs, setNotificationPrefs } = useSettings();

  return (
    <div className="space-y-6">
      <Link href="/profile" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("nav.profile")}
      </Link>

      <h1 className="text-xl font-semibold">{t("notifications.title")}</h1>

      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <span className="text-sm font-medium">Push</span>
          <Switch
            checked={notificationPrefs.push}
            onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, push: checked })}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <span className="text-sm font-medium">Email</span>
          <Switch
            checked={notificationPrefs.email}
            onCheckedChange={(checked) => setNotificationPrefs({ ...notificationPrefs, email: checked })}
          />
        </div>
      </div>
    </div>
  );
}
