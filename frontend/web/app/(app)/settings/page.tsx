"use client";

import { useRef, useState } from "react";
import { Copy, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";

function BusinessProfile() {
  const { t } = useLanguage();
  const { merchant, refreshProfile } = useAuth();
  const [businessName, setBusinessName] = useState(merchant?.business_name ?? "");
  const [logoUrl, setLogoUrl] = useState(merchant?.logo_url ?? "");
  const [defaultWebhookUrl, setDefaultWebhookUrl] = useState(merchant?.default_webhook_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const updated = await api.uploadLogo(file);
      setLogoUrl(updated.logo_url ?? "");
      await refreshProfile();
      toast.success(t("settings.businessProfile.logoUploaded"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.genericError"));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.updateProfile({
        business_name: businessName || null,
        logo_url: logoUrl || null,
        default_webhook_url: defaultWebhookUrl || null,
      });
      await refreshProfile();
      toast.success(t("settings.businessProfile.saved"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("common.genericError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.businessProfile.title")}</CardTitle>
        <CardDescription>{t("settings.businessProfile.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="business-name">{t("settings.businessProfile.businessName")}</Label>
            <Input
              id="business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={t("settings.businessProfile.businessNamePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo-url">{t("settings.businessProfile.logoUrl")}</Label>
            <div className="flex items-center gap-3">
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary merchant-provided URL, not a static/local asset
                <img
                  src={logoUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-md border border-border object-cover"
                />
              )}
              <Input
                id="logo-url"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="flex-1"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileSelected}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                aria-label={t("settings.businessProfile.uploadLogo")}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("settings.businessProfile.uploadHint")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="default-webhook-url">{t("settings.businessProfile.defaultWebhookUrl")}</Label>
            <Input
              id="default-webhook-url"
              type="url"
              value={defaultWebhookUrl}
              onChange={(e) => setDefaultWebhookUrl(e.target.value)}
              placeholder="https://example.com/webhooks/paycam"
            />
            <p className="text-xs text-muted-foreground">
              {t("settings.businessProfile.defaultWebhookUrlHint")}
            </p>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? t("settings.businessProfile.saving") : t("settings.businessProfile.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TwoFactorSetup() {
  const { t } = useLanguage();
  const { refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"password" | "verify">("password");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setOpen(false);
    setStep("password");
    setPassword("");
    setSecret("");
    setCode("");
    setError(null);
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.totpSetup(password);
      setSecret(res.secret);
      setStep("verify");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("settings.twoFactor.failedToStart"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.totpVerify(code);
      toast.success(t("settings.twoFactor.enabledToast"));
      await refreshProfile();
      reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("settings.twoFactor.invalidCode"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : reset())}>
      <DialogTrigger
        render={
          <Button size="sm">
            <ShieldCheck className="h-4 w-4" /> {t("settings.twoFactor.enableButton")}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === "password"
              ? t("settings.twoFactor.confirmPasswordTitle")
              : t("settings.twoFactor.scanKeyTitle")}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "password" ? (
          <form onSubmit={handleStart} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="setup-password">{t("settings.twoFactor.password")}</Label>
              <Input
                id="setup-password"
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? t("settings.twoFactor.confirming") : t("settings.twoFactor.continueButton")}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("settings.twoFactor.setupHint")}</p>
            <div className="space-y-2">
              <Label>{t("settings.twoFactor.setupKey")}</Label>
              <div className="flex gap-2">
                <Input readOnly value={secret} className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(secret);
                    toast.success(t("settings.twoFactor.setupKeyCopied"));
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verify-code">{t("settings.twoFactor.code")}</Label>
              <Input
                id="verify-code"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? t("settings.twoFactor.verifying") : t("settings.twoFactor.enableSubmit")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function SettingsPage() {
  const { t } = useLanguage();
  const { merchant, logout } = useAuth();

  if (!merchant) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.account.title")}</CardTitle>
          <CardDescription>{t("settings.account.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between border-b border-border py-2">
            <span className="text-sm text-muted-foreground">{t("settings.account.name")}</span>
            <span className="text-sm font-medium">
              {merchant.first_name} {merchant.last_name}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-border py-2">
            <span className="text-sm text-muted-foreground">{t("settings.account.email")}</span>
            <span className="text-sm font-medium">{merchant.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{t("settings.account.merchantSince")}</span>
            <span className="text-sm font-medium">{formatDate(merchant.created_at)}</span>
          </div>
        </CardContent>
      </Card>

      <BusinessProfile />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{t("settings.twoFactor.title")}</CardTitle>
            <CardDescription>{t("settings.twoFactor.description")}</CardDescription>
          </div>
          {merchant.totp_enabled ? (
            <Badge variant="outline" className="text-success border-success/30 bg-success/10">
              {t("settings.twoFactor.enabled")}
            </Badge>
          ) : (
            <TwoFactorSetup />
          )}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.session.title")}</CardTitle>
          <CardDescription>{t("settings.session.description")}</CardDescription>
        </CardHeader>
        <Separator />
        <CardFooter className="pt-6">
          <Button variant="destructive" onClick={logout}>
            {t("settings.session.logoutEverywhere")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
