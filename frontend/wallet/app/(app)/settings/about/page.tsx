"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("settings.title")}
      </Link>

      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Image src="/brand/logo-badge-black.png" alt="PayCam" width={56} height={56} className="rounded-xl dark:invert" />
        <div>
          <h1 className="text-lg font-semibold">PayCam</h1>
          <p className="text-sm text-muted-foreground">PayCam — Educational Project · Version 3.0.0</p>
        </div>
        <p className="max-w-xs text-sm text-muted-foreground">
          A simulated payment gateway for students to integrate against — Mobile Money, card, and
          crypto payment flows, no real money involved.
        </p>
      </div>

      <Link href="/legal" className="block text-center text-sm text-primary underline">
        {t("welcome.terms")} &amp; {t("welcome.privacyPolicy")}
      </Link>
    </div>
  );
}
