"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, ApiError } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/language-context";

export default function InvitesPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.inviteAdmin(email);
      toast.success(t("invites.sentToast"));
      setEmail("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.genericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("invites.title")}</CardTitle>
        <CardDescription>{t("invites.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="invite-email">{t("invites.email")}</Label>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@paycam.cm"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? t("invites.submitLoading") : t("invites.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
