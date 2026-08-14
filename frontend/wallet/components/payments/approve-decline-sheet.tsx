"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/common/countdown";
import { api, ApiError } from "@/lib/api-client";
import { formatAmount, monoNumeric, paymentMethodLabel } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/language-context";

export type PendingLikePayment = {
  reference: string;
  merchant_name: string;
  amount: string;
  currency: string;
  expires_at: string;
  description?: string;
  payment_method?: string;
};

export function ApproveDeclineSheet({
  payment,
  onOpenChange,
  onSettled,
}: {
  payment: PendingLikePayment | null;
  onOpenChange: (open: boolean) => void;
  onSettled: () => void;
}) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState<"approve" | "decline" | null>(null);
  const isCrypto = payment?.payment_method?.startsWith("crypto_") ?? false;

  const close = () => onOpenChange(false);

  const handleApprove = async () => {
    if (!payment) return;
    setLoading("approve");
    try {
      const res = await api.approvePayment(payment.reference);
      toast.success(res.crypto_tx_hash ? res.message ?? t("requests.paymentApproved") : t("requests.paymentApproved"));
      close();
      onSettled();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("errors.connectionError"));
    } finally {
      setLoading(null);
    }
  };

  const handleDecline = async () => {
    if (!payment) return;
    setLoading("decline");
    try {
      await api.declinePayment(payment.reference);
      toast.success(t("requests.paymentDeclined"));
      close();
      onSettled();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("errors.connectionError"));
    } finally {
      setLoading(null);
    }
  };

  return (
    <Sheet open={!!payment} onOpenChange={onOpenChange}>
      <SheetContent>
        {payment && (
          <div className="space-y-5">
            <div>
              <SheetTitle>{payment.merchant_name}</SheetTitle>
              <SheetDescription>{payment.description || t("requests.title")}</SheetDescription>
            </div>

            <p className={`text-3xl font-semibold ${monoNumeric}`}>
              {formatAmount(payment.amount, isCrypto ? payment.currency : "XAF")}
            </p>

            {payment.payment_method && (
              <p className="text-sm text-muted-foreground">
                {paymentMethodLabel(payment.payment_method, language)}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              <Countdown expiresAt={payment.expires_at} onExpire={close} />
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-12 flex-1"
                disabled={!!loading}
                onClick={handleDecline}
              >
                {loading === "decline" ? t("common.loading") : t("requests.decline")}
              </Button>
              <Button className="h-12 flex-1" disabled={!!loading} onClick={handleApprove}>
                {loading === "approve" ? t("common.loading") : t("requests.approve")}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
