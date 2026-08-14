"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionList } from "@/components/transactions/transaction-list";
import { useTransactions } from "@/lib/transactions-context";
import { useLanguage } from "@/lib/i18n/language-context";

const FILTERS = ["all", "success", "pending", "failed"] as const;

export default function HistoryPage() {
  const { transactions, loading } = useTransactions();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const filtered = useMemo(
    () => (filter === "all" ? transactions : transactions.filter((txn) => txn.status === filter)),
    [transactions, filter]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("history.title")}</h1>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="w-full">
          {FILTERS.map((f) => (
            <TabsTrigger key={f} value={f} className="flex-1">
              {t(`history.filter${f[0].toUpperCase()}${f.slice(1)}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t("history.noTransactions")}
        </p>
      ) : (
        <TransactionList transactions={filtered} />
      )}
    </div>
  );
}
