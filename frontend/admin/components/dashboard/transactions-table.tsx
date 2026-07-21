"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { MethodBadge } from "@/components/dashboard/method-badge";
import { formatAmount, formatDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Transaction } from "@/lib/api-client";

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const { t } = useLanguage();

  if (transactions.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        {t("table.empty")}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("table.reference")}</TableHead>
          <TableHead>{t("table.method")}</TableHead>
          <TableHead>{t("table.amount")}</TableHead>
          <TableHead>{t("table.status")}</TableHead>
          <TableHead>{t("table.date")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((txn) => (
          <TableRow key={txn.reference}>
            <TableCell className="font-mono text-sm">{txn.reference}</TableCell>
            <TableCell>
              <MethodBadge method={txn.payment_method} />
            </TableCell>
            <TableCell>{formatAmount(txn.amount, txn.currency)}</TableCell>
            <TableCell>
              <StatusBadge status={txn.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(txn.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
