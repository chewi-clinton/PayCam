"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ApproveDeclineSheet, type PendingLikePayment } from "@/components/payments/approve-decline-sheet";
import { Countdown } from "@/components/common/countdown";
import { formatAmount, monoNumeric } from "@/lib/format";
import { usePendingPayments } from "@/lib/use-pending-payments";
import { useTransactions } from "@/lib/transactions-context";
import { useLanguage } from "@/lib/i18n/language-context";

export default function RequestsPage() {
  const { t } = useLanguage();
  const { pending, loading, refresh } = usePendingPayments();
  const { refresh: refreshTransactions } = useTransactions();
  const [selected, setSelected] = useState<PendingLikePayment | null>(null);

  return (
    <div className="space-y-4">
      <Link href="/home" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("nav.home")}
      </Link>

      <div>
        <h1 className="text-xl font-semibold">{t("requests.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("requests.subtitle", { n: pending.length, s: pending.length === 1 ? "" : "s" })}
        </p>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : pending.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t("requests.noPendingRequests")}
        </p>
      ) : (
        <div className="space-y-2">
          {pending.map((p) => (
            <button
              key={p.reference}
              type="button"
              onClick={() => setSelected(p)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.merchant_name}</p>
                <p className="text-xs text-muted-foreground">
                  <Countdown expiresAt={p.expires_at} />
                </p>
              </div>
              <p className={`shrink-0 text-sm font-semibold ${monoNumeric}`}>
                {formatAmount(p.amount, p.currency)}
              </p>
            </button>
          ))}
        </div>
      )}

      <ApproveDeclineSheet
        payment={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onSettled={() => {
          refresh();
          refreshTransactions();
        }}
      />
    </div>
  );
}
