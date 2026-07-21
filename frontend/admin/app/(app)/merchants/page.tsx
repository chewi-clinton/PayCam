"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { api, type Merchant } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/language-context";

const PAGE_SIZE = 20;

export default function MerchantsPage() {
  const { t } = useLanguage();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (currentOffset: number, currentSearch: string) => {
    setLoading(true);
    const res = await api.listMerchants({
      limit: PAGE_SIZE,
      offset: currentOffset,
      search: currentSearch || undefined,
    });
    setMerchants(res.results);
    setCount(res.count);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount/page/search change
    load(offset, search);
  }, [offset, search, load]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("merchants.title")}</CardTitle>
        <CardDescription>{t("merchants.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setOffset(0);
              setSearch(e.target.value);
            }}
            placeholder={t("merchants.searchPlaceholder")}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : merchants.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {t("merchants.empty")}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("merchants.table.merchant")}</TableHead>
                  <TableHead>{t("merchants.table.email")}</TableHead>
                  <TableHead>{t("merchants.table.apiKeys")}</TableHead>
                  <TableHead>{t("merchants.table.status")}</TableHead>
                  <TableHead>{t("merchants.table.created")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {merchants.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Link
                        href={`/merchants/${m.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {m.business_name || `${m.first_name} ${m.last_name}`}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.email}</TableCell>
                    <TableCell>{m.api_key_count}</TableCell>
                    <TableCell>
                      {m.is_suspended ? (
                        <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10">
                          {t("merchants.suspended")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-success border-success/30 bg-success/10">
                          {t("merchants.active")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(m.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {merchants.length === 0 ? 0 : offset + 1}–{offset + merchants.length} / {count}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                >
                  {t("common.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + PAGE_SIZE >= count}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  {t("common.next")}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
