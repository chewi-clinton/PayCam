"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { QrScanner } from "@/components/qr/qr-scanner";
import { ApproveDeclineSheet, type PendingLikePayment } from "@/components/payments/approve-decline-sheet";
import { api, ApiError } from "@/lib/api-client";
import { useTransactions } from "@/lib/transactions-context";
import { useLanguage } from "@/lib/i18n/language-context";

/** Mirrors the Flutter app's parsing: try {reference: "..."} JSON first,
 * fall back to treating the raw scanned text as the reference itself. */
function extractReference(raw: string): string {
  try {
    const data = JSON.parse(raw);
    if (data && typeof data.reference === "string") return data.reference;
  } catch {
    // not JSON — fall through
  }
  return raw.trim();
}

export default function ScanPage() {
  const { t } = useLanguage();
  const { refresh } = useTransactions();
  const [payment, setPayment] = useState<PendingLikePayment | null>(null);
  const [resolving, setResolving] = useState(false);

  const handleDecode = useCallback(
    async (raw: string) => {
      if (resolving) return;
      const reference = extractReference(raw);
      if (!reference) return;
      setResolving(true);
      try {
        const lookup = await api.lookupPayment(reference);
        if (lookup.status !== "pending") {
          toast.error(t("scanner.notPaycamQr"));
          return;
        }
        setPayment({
          reference: lookup.reference,
          merchant_name: lookup.merchant_name,
          amount: lookup.amount,
          currency: lookup.currency,
          expires_at: lookup.expires_at ?? new Date().toISOString(),
          payment_method: lookup.payment_method,
        });
      } catch (err) {
        toast.error(err instanceof ApiError ? t("scanner.notPaycamQr") : t("errors.connectionError"));
      } finally {
        setResolving(false);
      }
    },
    [resolving, t]
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("home.scanQr")}</h1>
      <QrScanner onDecode={handleDecode} />
      <ApproveDeclineSheet
        payment={payment}
        onOpenChange={(open) => !open && setPayment(null)}
        onSettled={refresh}
      />
    </div>
  );
}
