"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/docs/code-block";
import { LanguageToggle } from "@/components/docs/language-toggle";
import { ParamsTable } from "@/components/docs/params-table";
import { Callout } from "@/components/docs/callout";
import { useDocs } from "@/lib/docs-context";
import { useScrollSpy } from "@/lib/use-scroll-spy";
import { DOCS_NAV_FLAT } from "@/lib/docs-nav";
import { useLanguage } from "@/lib/i18n/language-context";

const ERROR_CODES = [
  "PAY_CAM_4000",
  "PAY_CAM_4001",
  "PAY_CAM_4002",
  "PAY_CAM_4003",
  "PAY_CAM_4004",
  "PAY_CAM_4006",
  "PAY_CAM_4007",
  "PAY_CAM_4008",
  "PAY_CAM_4009",
  "PAY_CAM_4011",
  "PAY_CAM_4012",
  "PAY_CAM_4013",
  "PAY_CAM_5000",
] as const;

const ERROR_HTTP: Record<string, string> = {
  PAY_CAM_4000: "400",
  PAY_CAM_4001: "404",
  PAY_CAM_4002: "400",
  PAY_CAM_4003: "400",
  PAY_CAM_4004: "404",
  PAY_CAM_4006: "409",
  PAY_CAM_4007: "400",
  PAY_CAM_4008: "400",
  PAY_CAM_4009: "400",
  PAY_CAM_4011: "401",
  PAY_CAM_4012: "400",
  PAY_CAM_4013: "404",
  PAY_CAM_5000: "500",
};

const ERROR_SLUG: Record<string, string> = {
  PAY_CAM_4000: "invalid_request",
  PAY_CAM_4001: "customer_not_found",
  PAY_CAM_4002: "insufficient_funds",
  PAY_CAM_4003: "card_declined",
  PAY_CAM_4004: "crypto_wallet_not_found",
  PAY_CAM_4006: "idempotency_key_mismatch",
  PAY_CAM_4007: "payment_expired",
  PAY_CAM_4008: "invalid_card_number",
  PAY_CAM_4009: "invalid_cvv",
  PAY_CAM_4011: "unauthorized",
  PAY_CAM_4012: "webhook_signature_invalid",
  PAY_CAM_4013: "transaction_not_found",
  PAY_CAM_5000: "internal_error",
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 space-y-4 border-b border-border pb-12">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function ApiKeyBar() {
  const { apiKey, setApiKey } = useDocs();
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="docs-api-key" className="text-xs">
          {t("docs.apiKeyBar.label")}
        </Label>
        <Input
          id="docs-api-key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk_live_..."
          className="font-mono text-sm"
        />
      </div>
      <LanguageToggle />
    </div>
  );
}

export default function DocsPage() {
  const { setActiveSection } = useDocs();
  const { t } = useLanguage();
  useScrollSpy(
    DOCS_NAV_FLAT.map((n) => n.id),
    setActiveSection
  );

  return (
    <div className="mx-auto max-w-3xl space-y-12 px-6 py-10">
      <Section id="introduction" title={t("docs.introduction.title")}>
        <p className="text-muted-foreground">{t("docs.introduction.intro")}</p>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">{t("docs.introduction.baseUrlLabel")}</p>
          <code className="text-sm font-medium">https://paycam.zardocard.com/api/v1</code>
        </div>
        <ApiKeyBar />
      </Section>

      <Section id="authentication" title={t("docs.authentication.title")}>
        <p className="text-muted-foreground">
          {t("docs.authentication.intro1")}{" "}
          <code className="text-sm">{t("docs.authentication.header")}</code>
          {t("docs.authentication.intro2")}{" "}
          <span className="font-medium text-foreground">{t("docs.authentication.apiKeysPage")}</span>{" "}
          {t("docs.authentication.intro3")}
        </p>
        <Callout type="security" title={t("docs.authentication.calloutTitle")}>
          {t("docs.authentication.calloutBody")}
        </Callout>
        <CodeBlock
          javascript={`const response = await fetch("https://paycam.zardocard.com/api/v1/payments/initiate/", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ /* ... */ }),
});`}
          python={`import requests

response = requests.post(
    "https://paycam.zardocard.com/api/v1/payments/initiate/",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={ }, # ...
)`}
        />
      </Section>

      <Section id="errors" title={t("docs.errors.title")}>
        <p className="text-muted-foreground">
          {t("docs.errors.intro1")}{" "}
          <code className="text-sm">code</code>{" "}
          {t("docs.errors.intro2")}
        </p>
        <CodeBlock
          javascript={`{
  "error": "customer_not_found",
  "code": "PAY_CAM_4001",
  "message": "Phone number not registered on PayCam."
}`}
          python={`{
  "error": "customer_not_found",
  "code": "PAY_CAM_4001",
  "message": "Phone number not registered on PayCam."
}`}
        />
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2 text-left font-medium">{t("docs.errors.table.code")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("docs.errors.table.http")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("docs.errors.table.error")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("docs.errors.table.meaning")}</th>
              </tr>
            </thead>
            <tbody>
              {ERROR_CODES.map((code) => (
                <tr key={code} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{code}</td>
                  <td className="px-4 py-2 text-muted-foreground">{ERROR_HTTP[code]}</td>
                  <td className="px-4 py-2 font-mono text-xs">{ERROR_SLUG[code]}</td>
                  <td className="px-4 py-2">{t(`docs.errors.meanings.${code}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="security" title={t("docs.security.title")}>
        <p className="text-muted-foreground">{t("docs.security.intro")}</p>

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 font-medium">{t("docs.security.apiKeys.heading")}</h3>
            <p className="text-sm text-muted-foreground">{t("docs.security.apiKeys.body")}</p>
          </div>

          <Callout type="warning" title={t("docs.security.noRevocation.calloutTitle")}>
            {t("docs.security.noRevocation.calloutBody")}
          </Callout>

          <div>
            <h3 className="mb-2 font-medium">{t("docs.security.webhookSignatures.heading")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("docs.security.webhookSignatures.body1")}{" "}
              <code className="text-sm">{t("docs.security.webhookSignatures.header")}</code>{" "}
              {t("docs.security.webhookSignatures.body2")}{" "}
              <a href="#webhooks" className="text-primary hover:underline">
                {t("docs.security.webhookSignatures.webhooksSection")}
              </a>
              {t("docs.security.webhookSignatures.body3")}
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-medium">{t("docs.security.idempotency.heading")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("docs.security.idempotency.body1")}{" "}
              <code className="text-sm">{t("docs.security.idempotency.key")}</code>{" "}
              {t("docs.security.idempotency.body2")}
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-medium">{t("docs.security.cardData.heading")}</h3>
            <p className="text-sm text-muted-foreground">{t("docs.security.cardData.body")}</p>
          </div>

          <div>
            <h3 className="mb-2 font-medium">{t("docs.security.cryptoTestnet.heading")}</h3>
            <p className="text-sm text-muted-foreground">{t("docs.security.cryptoTestnet.body")}</p>
          </div>

          <div>
            <h3 className="mb-2 font-medium">{t("docs.security.rateLimiting.heading")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("docs.security.rateLimiting.body1")}{" "}
              <a href="#rate-limits" className="text-primary hover:underline">
                {t("docs.security.rateLimiting.rateLimitsSection")}
              </a>
              {t("docs.security.rateLimiting.body2")}
            </p>
          </div>
        </div>
      </Section>

      <Section id="rate-limits" title={t("docs.rateLimits.title")}>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2 text-left font-medium">{t("docs.rateLimits.table.endpointGroup")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("docs.rateLimits.table.limit")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-2">{t("docs.rateLimits.table.initiatingPayments")}</td>
                <td className="px-4 py-2 font-mono text-xs">60 / min</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2">{t("docs.rateLimits.table.readingPayments")}</td>
                <td className="px-4 py-2 font-mono text-xs">120 / min</td>
              </tr>
              <tr>
                <td className="px-4 py-2">{t("docs.rateLimits.table.login")}</td>
                <td className="px-4 py-2 font-mono text-xs">10 / min</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("docs.rateLimits.exceedingPrefix")}{" "}
          <code className="text-sm">429 Too Many Requests</code>.
        </p>
      </Section>

      <Section id="mobile-money" title={t("docs.mobileMoney.title")}>
        <p className="text-muted-foreground">{t("docs.mobileMoney.intro")}</p>
        <div className="flex items-center gap-2">
          <Badge>POST</Badge>
          <code className="text-sm">/payments/initiate/</code>
        </div>
        <ParamsTable
          params={[
            { name: "amount", type: "string", required: true, description: t("docs.mobileMoney.params.amount") },
            { name: "currency", type: "string", required: true, description: t("docs.mobileMoney.params.currency") },
            { name: "payment_method", type: "string", required: true, description: t("docs.mobileMoney.params.paymentMethod") },
            { name: "phone_number", type: "string", required: true, description: t("docs.mobileMoney.params.phoneNumber") },
            { name: "description", type: "string", description: t("docs.mobileMoney.params.description") },
            { name: "external_reference", type: "string", description: t("docs.mobileMoney.params.externalReference") },
            { name: "webhook_url", type: "string", description: t("docs.mobileMoney.params.webhookUrl") },
            { name: "idempotency_key", type: "string", description: t("docs.mobileMoney.params.idempotencyKey") },
          ]}
        />
        <Callout type="tip">
          {t("docs.mobileMoney.tipPrefix")}{" "}
          <code>{t("docs.mobileMoney.key")}</code>{" "}
          {t("docs.mobileMoney.tipSuffix")}{" "}
          <a href="#security" className="text-primary hover:underline">{t("docs.mobileMoney.securitySection")}</a>.
        </Callout>
        <CodeBlock
          javascript={`const response = await fetch("https://paycam.zardocard.com/api/v1/payments/initiate/", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: "5000",
    currency: "XAF",
    payment_method: "mtn_momo",
    phone_number: "237670123456",
    description: "Order #1042",
    external_reference: "ORD-1042",
  }),
});

const payment = await response.json();
console.log(payment.reference, payment.status);`}
          python={`import requests

response = requests.post(
    "https://paycam.zardocard.com/api/v1/payments/initiate/",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={
        "amount": "5000",
        "currency": "XAF",
        "payment_method": "mtn_momo",
        "phone_number": "237670123456",
        "description": "Order #1042",
        "external_reference": "ORD-1042",
    },
)

payment = response.json()
print(payment["reference"], payment["status"])`}
        />
        <p className="text-sm text-muted-foreground">{t("docs.mobileMoney.responseLabel")}</p>
        <CodeBlock
          javascript={`{
  "reference": "TXN_20260101_Ab3Xk9Lm2Qr",
  "status": "pending",
  "payment_url": "https://pay.paycam.cm/pay/TXN_20260101_Ab3Xk9Lm2Qr",
  "expires_at": "2026-01-01T10:15:00Z"
}`}
          python={`{
  "reference": "TXN_20260101_Ab3Xk9Lm2Qr",
  "status": "pending",
  "payment_url": "https://pay.paycam.cm/pay/TXN_20260101_Ab3Xk9Lm2Qr",
  "expires_at": "2026-01-01T10:15:00Z"
}`}
        />
      </Section>

      <Section id="card" title={t("docs.card.title")}>
        <p className="text-muted-foreground">{t("docs.card.intro")}</p>
        <div className="flex items-center gap-2">
          <Badge>POST</Badge>
          <code className="text-sm">/payments/card/initiate/</code>
        </div>
        <ParamsTable
          params={[
            { name: "amount", type: "string", required: true, description: t("docs.card.params.amount") },
            { name: "currency", type: "string", required: true, description: t("docs.card.params.currency") },
            { name: "card_number", type: "string", required: true, description: t("docs.card.params.cardNumber") },
            { name: "expiry_month", type: "number", required: true, description: t("docs.card.params.expiryMonth") },
            { name: "expiry_year", type: "number", required: true, description: t("docs.card.params.expiryYear") },
            { name: "cvv", type: "string", required: true, description: t("docs.card.params.cvv") },
            { name: "description", type: "string", description: t("docs.card.params.description") },
            { name: "webhook_url", type: "string", description: t("docs.card.params.webhookUrl") },
          ]}
        />
        <CodeBlock
          javascript={`const response = await fetch("https://paycam.zardocard.com/api/v1/payments/card/initiate/", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: "25.00",
    currency: "USD",
    card_number: "4242424242424242",
    expiry_month: 12,
    expiry_year: 2028,
    cvv: "123",
    description: "Order #1042",
  }),
});`}
          python={`import requests

response = requests.post(
    "https://paycam.zardocard.com/api/v1/payments/card/initiate/",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={
        "amount": "25.00",
        "currency": "USD",
        "card_number": "4242424242424242",
        "expiry_month": 12,
        "expiry_year": 2028,
        "cvv": "123",
        "description": "Order #1042",
    },
)`}
        />
      </Section>

      <Section id="crypto" title={t("docs.crypto.title")}>
        <p className="text-muted-foreground">{t("docs.crypto.intro")}</p>
        <Callout type="info">
          {t("docs.crypto.infoCalloutPrefix")}{" "}
          <a href="#security" className="text-primary hover:underline">{t("docs.crypto.securitySection")}</a>.
        </Callout>
        <div className="flex items-center gap-2">
          <Badge>POST</Badge>
          <code className="text-sm">/payments/crypto/initiate/</code>
        </div>
        <ParamsTable
          params={[
            { name: "amount", type: "string", required: true, description: t("docs.crypto.params.amount") },
            { name: "currency", type: "string", required: true, description: t("docs.crypto.params.currency") },
            { name: "crypto_wallet_address", type: "string", required: true, description: t("docs.crypto.params.cryptoWalletAddress") },
            { name: "description", type: "string", description: t("docs.crypto.params.description") },
            { name: "webhook_url", type: "string", description: t("docs.crypto.params.webhookUrl") },
          ]}
        />
        <CodeBlock
          javascript={`const response = await fetch("https://paycam.zardocard.com/api/v1/payments/crypto/initiate/", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: "0.0005",
    currency: "BTC",
    crypto_wallet_address: "tb1q...",
    description: "Order #1042",
  }),
});

const payment = await response.json();
// payment.qr_code is a data:image/png;base64,... string you can render directly
document.querySelector("img#qr").src = payment.qr_code;`}
          python={`import requests

response = requests.post(
    "https://paycam.zardocard.com/api/v1/payments/crypto/initiate/",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={
        "amount": "0.0005",
        "currency": "BTC",
        "crypto_wallet_address": "tb1q...",
        "description": "Order #1042",
    },
)

payment = response.json()
# payment["qr_code"] is a data:image/png;base64,... string
`}
        />
        <p className="text-sm text-muted-foreground">
          {t("docs.crypto.sandboxPrefix")}{" "}
          <a href="/sandbox" className="text-primary hover:underline">{t("docs.crypto.sandboxLink")}</a>{" "}
          {t("docs.crypto.sandboxSuffix")}
        </p>
      </Section>

      <Section id="retrieve" title={t("docs.retrieve.title")}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">GET</Badge>
            <code className="text-sm">/payments/</code>
          </div>
          <p className="text-sm text-muted-foreground">{t("docs.retrieve.listDesc")}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">GET</Badge>
            <code className="text-sm">/payments/{"{reference}"}/</code>
          </div>
          <p className="text-sm text-muted-foreground">{t("docs.retrieve.detailDesc")}</p>
        </div>
        <CodeBlock
          javascript={`const response = await fetch("https://paycam.zardocard.com/api/v1/payments/TXN_20260101_Ab3Xk9Lm2Qr/", {
  headers: { "Authorization": "Bearer YOUR_API_KEY" },
});
const payment = await response.json();`}
          python={`import requests

response = requests.get(
    "https://paycam.zardocard.com/api/v1/payments/TXN_20260101_Ab3Xk9Lm2Qr/",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
)
payment = response.json()`}
        />
      </Section>

      <Section id="webhooks" title={t("docs.webhooks.title")}>
        <p className="text-muted-foreground">
          {t("docs.webhooks.intro1")}{" "}
          <code className="text-sm">{t("docs.webhooks.key")}</code>{" "}
          {t("docs.webhooks.intro2")}
        </p>
        <CodeBlock
          javascript={`{
  "event": "payment.pending",
  "data": {
    "reference": "TXN_20260101_Ab3Xk9Lm2Qr",
    "status": "pending",
    "amount": "5000",
    "currency": "XAF",
    "payment_method": "mtn_momo",
    "phone_number": "237670123456",
    "merchant_id": 42,
    "created_at": "2026-01-01T10:00:00Z",
    "updated_at": "2026-01-01T10:00:00Z"
  }
}`}
          python={`{
  "event": "payment.pending",
  "data": {
    "reference": "TXN_20260101_Ab3Xk9Lm2Qr",
    "status": "pending",
    "amount": "5000",
    "currency": "XAF",
    "payment_method": "mtn_momo",
    "phone_number": "237670123456",
    "merchant_id": 42,
    "created_at": "2026-01-01T10:00:00Z",
    "updated_at": "2026-01-01T10:00:00Z"
  }
}`}
        />
        <p className="text-muted-foreground">
          {t("docs.webhooks.signatureIntro1")}{" "}
          <code className="text-sm">{t("docs.webhooks.header")}</code>{" "}
          {t("docs.webhooks.signatureIntro2")}{" "}
          <code className="text-sm">{t("docs.webhooks.signatureFormat")}</code>.{" "}
          {t("docs.webhooks.signatureIntro3")}
        </p>
        <Callout type="security" title={t("docs.webhooks.calloutTitle")}>
          {t("docs.webhooks.calloutBody1")}{" "}
          <code>{t("docs.webhooks.header")}</code>, {t("docs.webhooks.calloutBody2")}
        </Callout>
        <CodeBlock
          javascript={`import crypto from "node:crypto";

function verifyWebhook(rawBody, signatureHeader, webhookSecret) {
  const [tPart, v1Part] = signatureHeader.split(",");
  const timestamp = tPart.split("=")[1];
  const expected = v1Part.split("=")[1];

  const signedPayload = \`\${timestamp}.\${rawBody}\`;
  const computed = crypto
    .createHmac("sha256", webhookSecret)
    .update(signedPayload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expected));
}`}
          python={`import hmac
import hashlib

def verify_webhook(raw_body, signature_header, webhook_secret):
    t_part, v1_part = signature_header.split(",")
    timestamp = t_part.split("=")[1]
    expected = v1_part.split("=")[1]

    signed_payload = f"{timestamp}.{raw_body}"
    computed = hmac.new(
        webhook_secret.encode(), signed_payload.encode(), hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(computed, expected)`}
        />
      </Section>
    </div>
  );
}
