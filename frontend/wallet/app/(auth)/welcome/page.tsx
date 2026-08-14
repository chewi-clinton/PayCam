"use client";

import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

export default function WelcomePage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <Image src="/brand/logo-badge-black.png" alt="PayCam" width={72} height={72} className="rounded-2xl dark:hidden" />
      <Image
        src="/brand/logo-badge-black.png"
        alt="PayCam"
        width={72}
        height={72}
        className="hidden rounded-2xl dark:block dark:invert"
      />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("welcome.title")}</h1>
        <p className="text-muted-foreground">{t("welcome.subtitle")}</p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <Link href="/register" className={cn(buttonVariants({ className: "h-14 text-base" }))}>
          {t("welcome.createAccount")}
        </Link>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline", className: "h-14 text-base" }))}
        >
          {t("welcome.login")}
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("welcome.agreePrefix")}
        <Link href="/legal" className="underline">
          {t("welcome.terms")}
        </Link>
        {t("welcome.and")}
        <Link href="/legal" className="underline">
          {t("welcome.privacyPolicy")}
        </Link>
      </p>
    </div>
  );
}
