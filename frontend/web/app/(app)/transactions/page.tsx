"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { api, type Transaction } from "@/lib/api-client";
import { useTransactionUpdates } from "@/lib/use-transaction-updates";

const PAGE_SIZE = 20;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (currentOffset: number) => {
    setLoading(true);
    const res = await api.listTransactions({ limit: PAGE_SIZE, offset: currentOffset });
    setTransactions(res.results);
    setCount(res.count);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount/page change
    load(offset);
  }, [offset, load]);

  useTransactionUpdates(() => {
    if (offset === 0) load(0);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <>
            <TransactionsTable transactions={transactions} />
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {transactions.length === 0 ? 0 : offset + 1}–{offset + transactions.length} of{" "}
                {count}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + PAGE_SIZE >= count}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
