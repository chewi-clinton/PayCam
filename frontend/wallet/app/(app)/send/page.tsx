"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Lottie from "lottie-react";
import { useLanguage } from "@/lib/i18n/language-context";
import sendMoney from "@/lib/lottie/send_money.json";

export default function SendPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <Link href="/home" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("nav.home")}
      </Link>

      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <Lottie animationData={sendMoney} loop className="w-40" />
        <div>
          <h1 className="text-lg font-semibold">{t("send.unavailableTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("send.unavailableBody")}</p>
        </div>
      </div>
    </div>
  );
}
