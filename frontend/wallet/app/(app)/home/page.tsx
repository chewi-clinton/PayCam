"use client";

import Link from "next/link";
import { Send, Download, QrCode, History } from "lucide-react";
import { BalanceCard } from "@/components/wallet/balance-card";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";

const QUICK_ACTIONS = [
  { href: "/send", key: "send", icon: Send },
  { href: "/receive", key: "receive", icon: Download },
  { href: "/scan", key: "scanQr", icon: QrCode },
  { href: "/history", key: "history", icon: History },
] as const;

export default function HomePage() {
  const { user, wallet } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{user?.full_name}</p>
      </div>

      <BalanceCard wallet={wallet} />

      <div className="grid grid-cols-4 gap-2">
        {QUICK_ACTIONS.map(({ href, key, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-center transition-colors hover:bg-muted"
          >
            <Icon className="h-5 w-5 text-primary" />
            <span className="text-xs">{t(`home.${key}`)}</span>
          </Link>
        ))}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t("home.recentTransactions")}</h2>
          <Link href="/history" className="text-xs text-primary">
            {t("home.seeAll")}
          </Link>
        </div>
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("home.noTransactionsYet")}
        </p>
      </div>
    </div>
  );
}
