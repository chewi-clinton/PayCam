import Link from "next/link";
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
import type { Transaction } from "@/lib/api-client";

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No transactions yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((txn) => (
          <TableRow key={txn.reference}>
            <TableCell>
              <Link
                href={`/transactions/${txn.reference}`}
                className="font-medium text-primary hover:underline"
              >
                {txn.reference}
              </Link>
            </TableCell>
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
