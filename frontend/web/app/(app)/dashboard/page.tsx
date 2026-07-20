"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet, ArrowLeftRight, CheckCircle2, Clock } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type DashboardSummary, type Transaction } from "@/lib/api-client";
import { formatAmount } from "@/lib/format";
import { useTransactionUpdates } from "@/lib/use-transaction-updates";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [summaryRes, transactionsRes] = await Promise.all([
      api.dashboardSummary(),
      api.listTransactions({ limit: 5 }),
    ]);
    setSummary(summaryRes);
    setRecent(transactionsRes.results);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    load();
  }, [load]);

  useTransactionUpdates(() => {
    load();
  });

  if (loading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Gross volume"
          value={formatAmount(summary.gross_volume_xaf, "XAF")}
          icon={Wallet}
        />
        <StatCard
          label="Transactions"
          value={String(summary.transaction_count)}
          icon={ArrowLeftRight}
        />
        <StatCard
          label="Success rate"
          value={`${summary.success_rate}%`}
          icon={CheckCircle2}
        />
        <StatCard label="Pending" value={String(summary.pending_count)} icon={Clock} />
      </div>

      <VolumeChart data={summary.last_7_days} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsTable transactions={recent} />
        </CardContent>
      </Card>
    </div>
  );
}
