"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, type WebhookLog } from "@/lib/api-client";
import { formatDate } from "@/lib/format";

function DeliveryBadge({ log }: { log: WebhookLog }) {
  if (log.delivered_at && log.http_status && log.http_status < 300) {
    return (
      <Badge variant="outline" className="text-success border-success/30 bg-success/10">
        Delivered
      </Badge>
    );
  }
  if (log.next_retry_at) {
    return (
      <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10">
        Retrying
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10">
      Failed
    </Badge>
  );
}

export default function WebhooksPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listWebhookLogs().then((res) => {
      setLogs(res.results);
      setLoading(false);
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook delivery logs</CardTitle>
        <CardDescription>
          Every attempt PayCam made to notify your webhook URL for a transaction.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            No webhook deliveries yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Attempt</TableHead>
                <TableHead>HTTP status</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">{log.transaction}</TableCell>
                  <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                    {log.url}
                  </TableCell>
                  <TableCell>{log.attempt_number}</TableCell>
                  <TableCell>{log.http_status ?? "—"}</TableCell>
                  <TableCell>
                    <DeliveryBadge log={log} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(log.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
