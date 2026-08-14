"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, PhoneIncoming, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api-client";
import { usePendingPayments } from "@/lib/use-pending-payments";
import { useTransactions } from "@/lib/transactions-context";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatAmount } from "@/lib/format";
import { relativeTime } from "@/lib/relative-time";

export default function NotificationsPage() {
  const { t, language } = useLanguage();
  const { pending, loading: pendingLoading, refresh: refreshPending } = usePendingPayments();
  const { transactions, loading: txLoading, refresh: refreshTransactions } = useTransactions();
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const recent = transactions.filter((t) => t.status !== "pending").slice(0, 8);
  const loading = pendingLoading || txLoading;

  const act = async (reference: string, approve: boolean) => {
    setBusy((prev) => new Set(prev).add(reference));
    try {
      if (approve) await api.approvePayment(reference);
      else await api.declinePayment(reference);
      await Promise.all([refreshPending(), refreshTransactions()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("errors.connectionError"));
    } finally {
      setBusy((prev) => {
        const next = new Set(prev);
        next.delete(reference);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      <Link href="/home" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("nav.home")}
      </Link>

      <h1 className="text-xl font-semibold">{t("notifications.title")}</h1>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : pending.length === 0 && recent.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t("notifications.noNotificationsYet")}
        </p>
      ) : (
        <div className="space-y-3">
          {pending.map((p) => (
            <div key={p.reference} className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <PhoneIncoming className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{t("notifications.incomingRequest")}</p>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {relativeTime(p.expires_at, t("notifications.justNow"), language)}
                    </p>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {p.description
                      ? t("notifications.requestBodyWithDescription", {
                          merchant: p.merchant_name,
                          amount: formatAmount(p.amount, p.currency),
                          description: p.description,
                        })
                      : t("notifications.requestBody", {
                          merchant: p.merchant_name,
                          amount: formatAmount(p.amount, p.currency),
                        })}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy.has(p.reference)}
                      onClick={() => act(p.reference, false)}
                    >
                      {t("requests.decline")}
                    </Button>
                    <Button size="sm" disabled={busy.has(p.reference)} onClick={() => act(p.reference, true)}>
                      {t("requests.approve")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {recent.map((txn) => {
            const success = txn.status === "success";
            const Icon = success ? CheckCircle2 : XCircle;
            return (
              <div key={txn.reference} className="rounded-lg border border-border p-3">
                <div className="flex gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {success ? t("notifications.paymentApprovedTitle") : t("notifications.paymentDeclinedTitle")}
                      </p>
                      <p className="shrink-0 text-xs text-muted-foreground">
                        {relativeTime(txn.created_at, t("notifications.justNow"), language)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {success
                        ? t("notifications.paymentSuccessBody", {
                            amount: formatAmount(txn.amount, "XAF"),
                            merchant: txn.merchant_name,
                          })
                        : t("notifications.paymentOtherBody", {
                            merchant: txn.merchant_name,
                            amount: formatAmount(txn.amount, "XAF"),
                            status: txn.status,
                          })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
