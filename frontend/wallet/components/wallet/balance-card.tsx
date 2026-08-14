"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatAmount, monoNumeric } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Wallet } from "@/lib/api-client";

export function BalanceCard({ wallet }: { wallet: Wallet | null }) {
  const { t } = useLanguage();
  const [hidden, setHidden] = useState(false);

  return (
    <Card className="border-none bg-primary p-6 text-primary-foreground">
      <div className="flex items-center justify-between">
        <p className="text-sm opacity-80">{t("home.availableBalance")}</p>
        <button
          type="button"
          onClick={() => setHidden((h) => !h)}
          aria-label={hidden ? "Show balance" : "Hide balance"}
          className="cursor-pointer opacity-80 hover:opacity-100"
        >
          {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <p className={`mt-2 text-3xl font-semibold ${monoNumeric}`}>
        {wallet ? (hidden ? "•••••••" : formatAmount(wallet.balance, "XAF")) : "…"}
      </p>
      {wallet && <p className="mt-1 text-xs opacity-70">{wallet.network}</p>}
    </Card>
  );
}
