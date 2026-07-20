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

export default function SandboxPage() {
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
          <CardTitle>Sandbox</CardTitle>
          <CardDescription>
            Trigger a real payment against your own live API key to test integration and QR
            codes. This calls the same endpoints your server would call — nothing here is
            simulated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="sandbox-key">API key</Label>
            <Input
              id="sandbox-key"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="sk_live_..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Stored only in this browser. Get one from the API Keys page.
            </p>
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
      setError(err instanceof SandboxApiError ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mobile Money (XAF)</CardTitle>
        <CardDescription>
          Sends a push notification to the customer&apos;s PayCam app for approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Network</Label>
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
            <Label htmlFor="momo-amount">Amount (XAF)</Label>
            <Input
              id="momo-amount"
              inputMode="decimal"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="momo-phone">Customer phone number</Label>
            <Input
              id="momo-phone"
              required
              placeholder="237670123456"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Must be a registered PayCam mobile app customer.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="momo-description">Description</Label>
            <Textarea
              id="momo-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !apiKey}>
            {loading ? "Sending…" : "Initiate payment"}
          </Button>
          {!apiKey && (
            <p className="text-xs text-muted-foreground">Enter an API key above first.</p>
          )}
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono">{result.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="capitalize">{result.status}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Approve or decline it from the customer&apos;s PayCam mobile app.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CryptoTester({ apiKey }: { apiKey: string }) {
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
      setError(err instanceof SandboxApiError ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crypto (testnet)</CardTitle>
        <CardDescription>
          Sends to a PayCam-generated customer wallet address and returns a scannable QR code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Currency</Label>
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
            <Label htmlFor="crypto-amount">Amount</Label>
            <Input
              id="crypto-amount"
              inputMode="decimal"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crypto-address">Customer wallet address</Label>
            <Input
              id="crypto-address"
              required
              placeholder="PayCam-generated testnet address"
              className="font-mono text-sm"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Only addresses PayCam generated for a customer are accepted.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="crypto-description">Description</Label>
            <Textarea
              id="crypto-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !apiKey}>
            {loading ? "Sending…" : "Initiate payment"}
          </Button>
          {!apiKey && (
            <p className="text-xs text-muted-foreground">Enter an API key above first.</p>
          )}
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-3 rounded-lg border border-border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono">{result.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
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
