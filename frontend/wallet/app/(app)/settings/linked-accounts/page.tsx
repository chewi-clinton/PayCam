"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatAmount, monoNumeric } from "@/lib/format";

export default function LinkedAccountsPage() {
  const { t } = useLanguage();
  const { wallet, cryptoWallets } = useAuth();

  return (
    <div className="space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("settings.title")}
      </Link>

      <h1 className="text-xl font-semibold">{t("settings.linkedAccounts")}</h1>

      {wallet && (
        <Card className="flex items-center justify-between p-4">
          <span className="text-sm font-medium">{wallet.network} Mobile Money</span>
          <span className={`text-sm ${monoNumeric}`}>{formatAmount(wallet.balance, "XAF")}</span>
        </Card>
      )}

      {cryptoWallets.map((cw) => (
        <Card key={cw.currency} className="flex items-center justify-between p-4">
          <span className="text-sm font-medium">{cw.currency}</span>
          <span className={`text-sm ${monoNumeric}`}>{formatAmount(cw.balance, cw.currency)}</span>
        </Card>
      ))}
    </div>
  );
}
