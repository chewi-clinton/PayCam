"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/language-context";

export default function ForgotPinPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 text-center">
      <h1 className="text-2xl font-semibold">{t("forgotPin.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("forgotPin.body")}</p>
      <Button className="h-12 w-full" onClick={() => (window.location.href = "mailto:support@paycam.cm")}>
        {t("forgotPin.contactSupport")}
      </Button>
    </div>
  );
}
