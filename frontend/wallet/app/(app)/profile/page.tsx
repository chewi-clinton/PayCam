"use client";

import Link from "next/link";
import { Settings2, Shield, Bell, KeyRound, LogOut, User } from "lucide-react";
import { MenuItem } from "@/components/common/menu-item";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";
import { monoNumeric } from "@/lib/format";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">PayCam</h1>
        <Link href="/settings" className="text-muted-foreground">
          <Settings2 className="h-5 w-5" />
        </Link>
      </div>

      <div className="flex flex-col items-center gap-2 py-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <User className="h-9 w-9" />
        </div>
        <p className="text-lg font-semibold">{user?.full_name}</p>
        <p className={`text-sm text-muted-foreground ${monoNumeric}`}>{user?.phone_number}</p>
      </div>

      <div className="space-y-2">
        <MenuItem
          href="/settings/security"
          icon={Shield}
          title={t("profile.security")}
          subtitle={t("profile.securitySubtitle")}
        />
        <MenuItem
          href="/settings/notifications"
          icon={Bell}
          title={t("notifications.title")}
          subtitle={t("profile.notificationsSubtitle")}
        />
        <MenuItem
          href="/profile/change-pin"
          icon={KeyRound}
          title={t("profile.changePin")}
          subtitle={t("profile.changePinSubtitle")}
        />
      </div>

      <Button variant="ghost" className="w-full gap-2 text-destructive hover:text-destructive" onClick={logout}>
        <LogOut className="h-4 w-4" />
        {t("profile.logout")}
      </Button>
    </div>
  );
}
