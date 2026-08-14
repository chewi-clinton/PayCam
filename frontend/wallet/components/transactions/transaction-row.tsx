"use client";

import Link from "next/link";
import { Smartphone, CreditCard, Bitcoin } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { formatAmount, monoNumeric } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/language-context";
import type { AppTransaction } from "@/lib/api-client";

function MethodIcon({ method }: { method: string }) {
  if (method.startsWith("crypto_")) return <Bitcoin className="h-4 w-4" />;
  if (method === "card") return <CreditCard className="h-4 w-4" />;
  return <Smartphone className="h-4 w-4" />;
}

export function TransactionRow({ transaction }: { transaction: AppTransaction }) {
  const { language } = useLanguage();
  const isCrypto = transaction.payment_method.startsWith("crypto_");

  return (
    <Link
      href={`/history/${transaction.reference}`}
      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <MethodIcon method={transaction.payment_method} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{transaction.merchant_name}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(transaction.created_at).toLocaleTimeString(language === "fr" ? "fr-FR" : "en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-semibold ${monoNumeric}`}>
          {formatAmount(transaction.amount, isCrypto ? transaction.currency : "XAF")}
        </p>
        <div className="mt-0.5">
          <StatusBadge status={transaction.status} />
        </div>
      </div>
    </Link>
  );
}
