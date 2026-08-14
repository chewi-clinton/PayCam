"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowLeft, ShieldCheck, Users, HelpCircle, Info, LogOut } from "lucide-react";
import { MenuItem } from "@/components/common/menu-item";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";

export default function SettingsPage() {
  const { logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- avoid dark-mode toggle hydration mismatch
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="space-y-6">
      <Link href="/profile" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("nav.profile")}
      </Link>

      <div>
        <h1 className="text-xl font-semibold">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t("settings.preferences")}</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium">{t("settings.darkMode")}</span>
            <Switch checked={isDark} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm font-medium">{t("settings.language")}</span>
            <div className="flex overflow-hidden rounded-md border border-border text-xs">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 ${language === "en" ? "bg-primary text-primary-foreground" : ""}`}
              >
                {t("settings.english")}
              </button>
              <button
                type="button"
                onClick={() => setLanguage("fr")}
                className={`px-2.5 py-1 ${language === "fr" ? "bg-primary text-primary-foreground" : ""}`}
              >
                {t("settings.french")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t("settings.securitySection")}</h2>
        <div className="space-y-2">
          <MenuItem href="/settings/security" icon={ShieldCheck} title={t("profile.security")} />
          <MenuItem href="/settings/privacy" icon={ShieldCheck} title={t("settings.privacy")} />
          <MenuItem href="/settings/linked-accounts" icon={Users} title={t("settings.linkedAccounts")} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t("settings.support")}</h2>
        <div className="space-y-2">
          <MenuItem href="/settings/help" icon={HelpCircle} title={t("settings.helpCenter")} />
          <MenuItem href="/settings/about" icon={Info} title={t("settings.about")} />
        </div>
      </div>

      <Button variant="ghost" className="w-full gap-2 text-destructive hover:text-destructive" onClick={logout}>
        <LogOut className="h-4 w-4" />
        {t("settings.logOut")}
      </Button>
    </div>
  );
}
