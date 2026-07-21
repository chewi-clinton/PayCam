"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api, ApiError, type ApiKey } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";

export default function ApiKeysPage() {
  const { t } = useLanguage();
  const { merchant } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ api_key: string; webhook_secret: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await api.listApiKeys();
    setKeys(res.results);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await api.createApiKey(totpCode);
      setCreated({ api_key: res.api_key, webhook_secret: res.webhook_secret });
      setTotpCode("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("apiKeys.failedToCreate"));
    } finally {
      setCreating(false);
    }
  };

  const copy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(t("apiKeys.copiedToast", { label }));
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setCreated(null);
    setError(null);
    setTotpCode("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{t("apiKeys.title")}</CardTitle>
          <CardDescription>{t("apiKeys.description")}</CardDescription>
        </div>
        {merchant?.totp_enabled && (
          <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
            <DialogTrigger
              render={
                <Button size="sm">
                  <Plus className="h-4 w-4" /> {t("apiKeys.createButton")}
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {created ? t("apiKeys.dialog.createdTitle") : t("apiKeys.dialog.confirmTitle")}
                </DialogTitle>
              </DialogHeader>

              {created ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>{t("apiKeys.dialog.copyNotice")}</AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label>{t("apiKeys.dialog.apiKeyLabel")}</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={created.api_key} className="font-mono text-xs" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copy(created.api_key, t("apiKeys.dialog.apiKeyLabel"))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("apiKeys.dialog.webhookSecretLabel")}</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={created.webhook_secret} className="font-mono text-xs" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copy(created.webhook_secret, t("apiKeys.dialog.webhookSecretLabel"))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={closeDialog}>{t("apiKeys.dialog.done")}</Button>
                  </DialogFooter>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="create-totp">{t("apiKeys.dialog.totpCode")}</Label>
                    <Input
                      id="create-totp"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      autoFocus
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      placeholder="123456"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={creating}>
                      {creating ? t("apiKeys.dialog.creating") : t("apiKeys.dialog.createKey")}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {!merchant?.totp_enabled && (
          <Alert className="mb-4">
            <AlertDescription>
              {t("apiKeys.enable2faPrompt")}{" "}
              <Link href="/settings" className="font-medium text-primary hover:underline">
                {t("apiKeys.setup2fa")}
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {t("apiKeys.empty")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("apiKeys.table.key")}</TableHead>
                <TableHead>{t("apiKeys.table.environment")}</TableHead>
                <TableHead>{t("apiKeys.table.status")}</TableHead>
                <TableHead>{t("apiKeys.table.lastUsed")}</TableHead>
                <TableHead>{t("apiKeys.table.created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-mono text-sm">{key.prefix}…</TableCell>
                  <TableCell className="capitalize">{key.environment}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={key.is_active ? "text-success border-success/30 bg-success/10" : ""}>
                      {key.is_active ? t("apiKeys.active") : t("apiKeys.revoked")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {key.last_used_at ? formatDate(key.last_used_at) : t("common.never")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(key.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
