"use client";

import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export default function SendPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <Link href="/home" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("nav.home")}
      </Link>

      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <Construction className="h-12 w-12 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">{t("send.unavailableTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("send.unavailableBody")}</p>
        </div>
      </div>
    </div>
  );
}
