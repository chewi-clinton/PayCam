"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { MethodBadge } from "@/components/dashboard/method-badge";
import { api, ApiError, type Transaction } from "@/lib/api-client";
import { formatAmount, formatDate } from "@/lib/format";
import { useTransactionUpdates } from "@/lib/use-transaction-updates";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function TransactionDetail({ reference }: { reference: string }) {
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.getTransaction(reference);
      setTxn(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load transaction.");
    }
  }, [reference]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    load();
  }, [load]);

  useTransactionUpdates((update) => {
    if (update.reference === reference) load();
  });

  return (
    <div className="space-y-4">
      <Link
        href="/transactions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to transactions
      </Link>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!txn && !error && <Skeleton className="h-80" />}

      {txn && (
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-base">{txn.reference}</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Status" value={<StatusBadge status={txn.status} />} />
            <Row label="Amount" value={formatAmount(txn.amount, txn.currency)} />
            <Row label="Payment method" value={<MethodBadge method={txn.payment_method} />} />
            <Row label="Phone number" value={txn.phone_number ?? "—"} />
            <Row label="Description" value={txn.description ?? "—"} />
            <Row label="External reference" value={txn.external_reference ?? "—"} />
            <Row label="Created" value={formatDate(txn.created_at)} />
            <Row label="Last updated" value={formatDate(txn.updated_at)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
