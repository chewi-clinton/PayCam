"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import {
  api,
  ApiError,
  type MerchantDetail as MerchantDetailData,
  type Transaction,
} from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/language-context";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function MerchantDetail({ id }: { id: string }) {
  const { t } = useLanguage();
  const [merchant, setMerchant] = useState<MerchantDetailData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [merchantRes, transactionsRes] = await Promise.all([
        api.getMerchant(id),
        api.listMerchantTransactions(id, { limit: 10 }),
      ]);
      setMerchant(merchantRes);
      setTransactions(transactionsRes.results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("merchantDetail.failedToLoad"));
    }
  }, [id, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    load();
  }, [load]);

  const handleSuspend = async () => {
    setActionLoading(true);
    try {
      const updated = await api.suspendMerchant(id);
      setMerchant((prev) => (prev ? { ...prev, ...updated } : prev));
      toast.success(t("merchantDetail.status.suspendedToast"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.genericError"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    try {
      const updated = await api.reactivateMerchant(id);
      setMerchant((prev) => (prev ? { ...prev, ...updated } : prev));
      toast.success(t("merchantDetail.status.reactivatedToast"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.genericError"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (keyId: number) => {
    setActionLoading(true);
    try {
      await api.revokeApiKey(keyId);
      setMerchant((prev) =>
        prev
          ? {
              ...prev,
              api_keys: prev.api_keys.map((k) => (k.id === keyId ? { ...k, is_active: false } : k)),
            }
          : prev
      );
      toast.success(t("merchantDetail.apiKeys.revokedToast"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.genericError"));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Link
        href="/merchants"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("merchantDetail.backToMerchants")}
      </Link>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!merchant && !error && <Skeleton className="h-80" />}

      {merchant && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-base">
                {merchant.business_name || `${merchant.first_name} ${merchant.last_name}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Row label={t("merchantDetail.account.name")} value={`${merchant.first_name} ${merchant.last_name}`} />
              <Row label={t("merchantDetail.account.email")} value={merchant.email} />
              <Row
                label={t("merchantDetail.account.businessName")}
                value={merchant.business_name || t("merchantDetail.account.noBusinessName")}
              />
              <Row label={t("merchantDetail.account.merchantSince")} value={formatDate(merchant.created_at)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{t("merchantDetail.status.title")}</CardTitle>
                {merchant.is_suspended && (
                  <CardDescription className="text-destructive">
                    {t("merchantDetail.status.suspendedNotice")}
                  </CardDescription>
                )}
              </div>
              {merchant.is_suspended ? (
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button size="sm">
                        <CheckCircle2 className="h-4 w-4" /> {t("merchantDetail.status.reactivateButton")}
                      </Button>
                    }
                  />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("merchantDetail.status.reactivateConfirmTitle")}</DialogTitle>
                      <DialogDescription>{t("merchantDetail.status.reactivateConfirmBody")}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose render={<Button variant="outline">{t("common.cancel")}</Button>} />
                      <DialogClose
                        render={
                          <Button onClick={handleReactivate} disabled={actionLoading}>
                            {t("merchantDetail.status.confirm")}
                          </Button>
                        }
                      />
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button size="sm" variant="destructive">
                        <Ban className="h-4 w-4" /> {t("merchantDetail.status.suspendButton")}
                      </Button>
                    }
                  />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("merchantDetail.status.suspendConfirmTitle")}</DialogTitle>
                      <DialogDescription>{t("merchantDetail.status.suspendConfirmBody")}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose render={<Button variant="outline">{t("common.cancel")}</Button>} />
                      <DialogClose
                        render={
                          <Button variant="destructive" onClick={handleSuspend} disabled={actionLoading}>
                            {t("merchantDetail.status.confirm")}
                          </Button>
                        }
                      />
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("merchantDetail.apiKeys.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {merchant.api_keys.length === 0 ? (
                <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                  {t("merchantDetail.apiKeys.empty")}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("merchantDetail.apiKeys.table.key")}</TableHead>
                      <TableHead>{t("merchantDetail.apiKeys.table.environment")}</TableHead>
                      <TableHead>{t("merchantDetail.apiKeys.table.status")}</TableHead>
                      <TableHead>{t("merchantDetail.apiKeys.table.lastUsed")}</TableHead>
                      <TableHead>{t("merchantDetail.apiKeys.table.created")}</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {merchant.api_keys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-mono text-sm">{key.prefix}…</TableCell>
                        <TableCell className="capitalize">{key.environment}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={key.is_active ? "text-success border-success/30 bg-success/10" : ""}
                          >
                            {key.is_active
                              ? t("merchantDetail.apiKeys.active")
                              : t("merchantDetail.apiKeys.revoked")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {key.last_used_at ? formatDate(key.last_used_at) : t("common.never")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(key.created_at)}</TableCell>
                        <TableCell>
                          {key.is_active && (
                            <Dialog>
                              <DialogTrigger
                                render={
                                  <Button size="sm" variant="destructive">
                                    {t("merchantDetail.apiKeys.revokeButton")}
                                  </Button>
                                }
                              />
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{t("merchantDetail.apiKeys.revokeConfirmTitle")}</DialogTitle>
                                  <DialogDescription>{t("merchantDetail.apiKeys.revokeConfirmBody")}</DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <DialogClose render={<Button variant="outline">{t("common.cancel")}</Button>} />
                                  <DialogClose
                                    render={
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleRevoke(key.id)}
                                        disabled={actionLoading}
                                      >
                                        {t("merchantDetail.status.confirm")}
                                      </Button>
                                    }
                                  />
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("merchantDetail.transactions.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionsTable transactions={transactions} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
