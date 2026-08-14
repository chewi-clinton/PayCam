"use client";

import { use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/transactions/status-badge";
import { useTransactions } from "@/lib/transactions-context";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatAmount, formatDate, paymentMethodLabel, monoNumeric } from "@/lib/format";
import { shareText } from "@/lib/share";

const STATUS_ICON = {
  success: CheckCircle2,
  pending: Clock,
  failed: XCircle,
  expired: XCircle,
} as const;

const STATUS_TITLE_KEY = {
  success: "transactionDetail.paymentSuccessful",
  pending: "transactionDetail.paymentPending",
  failed: "transactionDetail.paymentFailed",
  expired: "transactionDetail.paymentExpired",
} as const;

export default function TransactionDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = use(params);
  const { transactions } = useTransactions();
  const { t, language } = useLanguage();

  const txn = transactions.find((candidate) => candidate.reference === reference);

  if (!txn) {
    return (
      <div className="space-y-4">
        <Link href="/history" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t("history.title")}
        </Link>
        <p className="py-10 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  const Icon = STATUS_ICON[txn.status];
  const isCrypto = txn.payment_method.startsWith("crypto_");
  const iconColor =
    txn.status === "success" ? "text-success" : txn.status === "pending" ? "text-warning" : "text-destructive";

  const receiptText = `PayCam — ${t(STATUS_TITLE_KEY[txn.status])}\n${t("transactionDetail.merchant")}: ${txn.merchant_name}\n${t(
    "transactionDetail.amount"
  )}: ${formatAmount(txn.amount, isCrypto ? txn.currency : "XAF")}\n${t("transactionDetail.referenceNumber")}: ${txn.reference}\n${formatDate(txn.created_at)}`;

  return (
    <div className="space-y-6">
      <Link href="/history" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("history.title")}
      </Link>

      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Icon className={`h-14 w-14 ${iconColor}`} />
        <h1 className="text-xl font-semibold">{t(STATUS_TITLE_KEY[txn.status])}</h1>
        <p className={`text-2xl font-semibold ${monoNumeric}`}>
          {formatAmount(txn.amount, isCrypto ? txn.currency : "XAF")}
        </p>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border">
        <Row label={t("transactionDetail.merchant")} value={txn.merchant_name} />
        <Row label={t("transactionDetail.paymentMethod")} value={paymentMethodLabel(txn.payment_method, language)} />
        <Row label={t("transactionDetail.status")} value={<StatusBadge status={txn.status} />} />
        <Row
          label={t("transactionDetail.referenceNumber")}
          value={
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 ${monoNumeric} cursor-pointer`}
              onClick={async () => {
                await navigator.clipboard.writeText(txn.reference);
                toast.success(t("transactionDetail.referenceCopied"));
              }}
            >
              {txn.reference}
              <Copy className="h-3.5 w-3.5" />
            </button>
          }
        />
        <Row label="" value={formatDate(txn.created_at)} muted />
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="h-12 w-full gap-2"
          onClick={async () => {
            const result = await shareText("PayCam receipt", receiptText);
            if (result === "copied") toast.success(t("common.copied"));
          }}
        >
          <Share2 className="h-4 w-4" />
          {t("transactionDetail.share")}
        </Button>
        <a
          href={`mailto:support@paycam.cm?subject=${encodeURIComponent(
            `Issue with transaction ${txn.reference}`
          )}`}
          className="text-center text-sm text-muted-foreground underline"
        >
          {t("transactionDetail.reportAnIssue")}
        </a>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 text-sm">
      {label && <span className="text-muted-foreground">{label}</span>}
      <span className={muted ? "text-xs text-muted-foreground" : "font-medium"}>{value}</span>
    </div>
  );
}
