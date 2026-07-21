"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSandboxApiKey,
  setSandboxApiKey,
  initiateMomoPayment,
  initiateCryptoPayment,
  SandboxApiError,
  type MomoInitiateResult,
  type CryptoInitiateResult,
} from "@/lib/sandbox-api";
import { useLanguage } from "@/lib/i18n/language-context";

export default function SandboxPage() {
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage on mount
    setApiKey(getSandboxApiKey());
  }, []);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    setSandboxApiKey(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("sandbox.title")}</CardTitle>
          <CardDescription>{t("sandbox.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="sandbox-key">{t("sandbox.apiKeyLabel")}</Label>
            <Input
              id="sandbox-key"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="sk_live_..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">{t("sandbox.apiKeyHint")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MomoTester apiKey={apiKey} />
        <CryptoTester apiKey={apiKey} />
      </div>
    </div>
  );
}

function MomoTester({ apiKey }: { apiKey: string }) {
  const { t } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState<"mtn_momo" | "orange_money">("mtn_momo");
  const [amount, setAmount] = useState("1000");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("Sandbox test payment");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MomoInitiateResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await initiateMomoPayment(apiKey, {
        amount,
        payment_method: paymentMethod,
        phone_number: phoneNumber,
        description,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof SandboxApiError ? err.message : t("sandbox.requestFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("sandbox.momo.title")}</CardTitle>
        <CardDescription>{t("sandbox.momo.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("sandbox.momo.network")}</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) => (v === "orange_money" ? "Orange Money" : "MTN MoMo")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mtn_momo">MTN MoMo</SelectItem>
                <SelectItem value="orange_money">Orange Money</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="momo-amount">{t("sandbox.momo.amount")}</Label>
            <Input
              id="momo-amount"
              inputMode="decimal"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="momo-phone">{t("sandbox.momo.phone")}</Label>
            <Input
              id="momo-phone"
              required
              placeholder="237670123456"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("sandbox.momo.phoneHint")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="momo-description">{t("sandbox.momo.description2")}</Label>
            <Textarea
              id="momo-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !apiKey}>
            {loading ? t("sandbox.momo.submitLoading") : t("sandbox.momo.submit")}
          </Button>
          {!apiKey && <p className="text-xs text-muted-foreground">{t("sandbox.momo.needKey")}</p>}
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("sandbox.momo.reference")}</span>
              <span className="font-mono">{result.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("sandbox.momo.status")}</span>
              <span className="capitalize">{result.status}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("sandbox.momo.approveHint")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CryptoTester({ apiKey }: { apiKey: string }) {
  const { t } = useLanguage();
  const [currency, setCurrency] = useState<"BTC" | "ETH" | "USDT">("BTC");
  const [amount, setAmount] = useState("0.0001");
  const [walletAddress, setWalletAddress] = useState("");
  const [description, setDescription] = useState("Sandbox test payment");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CryptoInitiateResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await initiateCryptoPayment(apiKey, {
        amount,
        currency,
        crypto_wallet_address: walletAddress,
        description,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof SandboxApiError ? err.message : t("sandbox.requestFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("sandbox.crypto.title")}</CardTitle>
        <CardDescription>{t("sandbox.crypto.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("sandbox.crypto.currency")}</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as typeof currency)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) =>
                    ({ BTC: "Bitcoin (BTC)", ETH: "Ethereum (ETH)", USDT: "USDT" })[v]
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="crypto-amount">{t("sandbox.crypto.amount")}</Label>
            <Input
              id="crypto-amount"
              inputMode="decimal"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crypto-address">{t("sandbox.crypto.walletAddress")}</Label>
            <Input
              id="crypto-address"
              required
              placeholder="PayCam-generated testnet address"
              className="font-mono text-sm"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("sandbox.crypto.walletHint")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="crypto-description">{t("sandbox.crypto.description2")}</Label>
            <Textarea
              id="crypto-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !apiKey}>
            {loading ? t("sandbox.crypto.submitLoading") : t("sandbox.crypto.submit")}
          </Button>
          {!apiKey && <p className="text-xs text-muted-foreground">{t("sandbox.crypto.needKey")}</p>}
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-3 rounded-lg border border-border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("sandbox.crypto.reference")}</span>
              <span className="font-mono">{result.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("sandbox.crypto.status")}</span>
              <span className="capitalize">{result.status}</span>
            </div>
            {result.qr_code && (
              <div className="flex justify-center pt-2">
                <Image
                  src={result.qr_code}
                  alt="Payment QR code"
                  width={200}
                  height={200}
                  unoptimized
                  className="rounded-lg border border-border"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
