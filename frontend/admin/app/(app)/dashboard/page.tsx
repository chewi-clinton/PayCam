"use client";

import { useCallback, useEffect, useState } from "react";
import { Store, Ban, Wallet, ArrowLeftRight, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type PlatformStats } from "@/lib/api-client";
import { formatAmount } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/language-context";

export default function DashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await api.platformStats();
    setStats(res);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    load();
  }, [load]);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label={t("dashboard.stats.merchants")} value={String(stats.merchant_count)} icon={Store} />
        <StatCard
          label={t("dashboard.stats.suspendedMerchants")}
          value={String(stats.suspended_merchant_count)}
          icon={Ban}
        />
        <StatCard
          label={t("dashboard.stats.grossVolume")}
          value={formatAmount(stats.gross_volume_xaf, "XAF")}
          icon={Wallet}
        />
        <StatCard
          label={t("dashboard.stats.transactions")}
          value={String(stats.transaction_count)}
          icon={ArrowLeftRight}
        />
        <StatCard label={t("dashboard.stats.successRate")} value={`${stats.success_rate}%`} icon={CheckCircle2} />
      </div>

      <VolumeChart data={stats.last_7_days} />
    </div>
  );
}
