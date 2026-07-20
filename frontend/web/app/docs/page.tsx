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

const ERROR_CODES = [
  ["PAY_CAM_4000", "400", "invalid_request", "Missing or invalid request parameters."],
  ["PAY_CAM_4001", "404", "customer_not_found", "Phone number not registered on PayCam."],
  ["PAY_CAM_4002", "400", "insufficient_funds", "Customer wallet balance too low."],
  ["PAY_CAM_4003", "400", "card_declined", "Card was declined."],
  ["PAY_CAM_4004", "404", "crypto_wallet_not_found", "Wallet address not registered on PayCam."],
  ["PAY_CAM_4006", "409", "idempotency_key_mismatch", "Idempotency key matches but request body differs."],
  ["PAY_CAM_4007", "400", "payment_expired", "Payment request has expired."],
  ["PAY_CAM_4008", "400", "invalid_card_number", "Card number failed Luhn validation."],
  ["PAY_CAM_4009", "400", "invalid_cvv", "CVV must be 3 digits."],
  ["PAY_CAM_4011", "401", "unauthorized", "Invalid or expired API key."],
  ["PAY_CAM_4012", "400", "webhook_signature_invalid", "Webhook signature verification failed."],
  ["PAY_CAM_4013", "404", "transaction_not_found", "Transaction not found or does not belong to you."],
  ["PAY_CAM_5000", "500", "internal_error", "An unexpected error occurred."],
];

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
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="docs-api-key" className="text-xs">
          Your API key (used to fill in the examples below — never sent anywhere but kept in
          this browser)
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
  useScrollSpy(
    DOCS_NAV_FLAT.map((n) => n.id),
    setActiveSection
  );

  return (
    <div className="mx-auto max-w-3xl space-y-12 px-6 py-10">
      <Section id="introduction" title="Introduction">
        <p className="text-muted-foreground">
          The PayCam API lets you accept MTN MoMo, Orange Money, card, and testnet crypto
          (BTC/ETH/USDT) payments from customers on the PayCam mobile app. All requests are
          made over HTTPS and both request and response bodies are JSON.
        </p>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Base URL</p>
          <code className="text-sm font-medium">https://paycam.zardocard.com/api/v1</code>
        </div>
        <ApiKeyBar />
      </Section>

      <Section id="authentication" title="Authentication">
        <p className="text-muted-foreground">
          Authenticate server-to-server requests with your live API key in the{" "}
          <code className="text-sm">Authorization</code>{" "}
          header. Get a key from the{" "}
          <span className="font-medium text-foreground">API Keys</span>{" "}
          page in your dashboard — it&apos;s shown once at creation, so store it securely on
          your server. Never expose it in client-side code.
        </p>
        <Callout type="security" title="Keep your API key on the server">
          Requests made with your API key act on your behalf with no further checks. Never ship
          it in a mobile app, a browser bundle, or a public repository — treat it like a
          password.
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

      <Section id="errors" title="Errors">
        <p className="text-muted-foreground">
          Errors return a JSON body with a stable{" "}
          <code className="text-sm">code</code>{" "}
          you can match on in your integration, in addition to the HTTP status.
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
                <th className="px-4 py-2 text-left font-medium">Code</th>
                <th className="px-4 py-2 text-left font-medium">HTTP</th>
                <th className="px-4 py-2 text-left font-medium">Error</th>
                <th className="px-4 py-2 text-left font-medium">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {ERROR_CODES.map(([code, http, error, meaning]) => (
                <tr key={code} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{code}</td>
                  <td className="px-4 py-2 text-muted-foreground">{http}</td>
                  <td className="px-4 py-2 font-mono text-xs">{error}</td>
                  <td className="px-4 py-2">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="security" title="Security">
        <p className="text-muted-foreground">
          A few things worth building into your integration from day one, rather than bolting
          on later.
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 font-medium">API keys</h3>
            <p className="text-sm text-muted-foreground">
              Keys are shown once, at creation, and stored on PayCam&apos;s side as a bcrypt
              hash — support cannot read your key back to you if you lose it. Creating a new
              key requires your account to have two-factor authentication enabled first.
            </p>
          </div>

          <Callout type="warning" title="No self-serve key revocation yet">
            There is currently no endpoint to disable a single compromised key. If you suspect
            a key has leaked, contact support — in the meantime, stop using it and issue a new
            one.
          </Callout>

          <div>
            <h3 className="mb-2 font-medium">Webhook signatures</h3>
            <p className="text-sm text-muted-foreground">
              Always verify the{" "}
              <code className="text-sm">PayCam-Signature</code>{" "}
              header before trusting a webhook payload — see the{" "}
              <a href="#webhooks" className="text-primary hover:underline">
                Webhooks
              </a>{" "}
              section. Without this check, anyone who guesses your webhook URL could post fake
              &quot;payment succeeded&quot; events to it.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-medium">Idempotency</h3>
            <p className="text-sm text-muted-foreground">
              Network retries are inevitable. Pass an{" "}
              <code className="text-sm">idempotency_key</code>{" "}
              on payment-initiating requests so a retried request returns the original
              transaction instead of creating a second charge.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-medium">Card data</h3>
            <p className="text-sm text-muted-foreground">
              Card numbers and CVVs are sent directly to PayCam over TLS and are never returned
              in any response. Don&apos;t log raw card numbers or CVVs on your own servers.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-medium">Crypto is testnet-only</h3>
            <p className="text-sm text-muted-foreground">
              BTC, ETH, and USDT payments move testnet assets with no real-world value — safe
              to integrate against and test freely. Only wallet addresses PayCam generated for
              a customer are accepted, which rules out sending to an arbitrary or spoofed
              address.
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-medium">Rate limiting</h3>
            <p className="text-sm text-muted-foreground">
              Endpoints are rate-limited per key (see{" "}
              <a href="#rate-limits" className="text-primary hover:underline">
                Rate limits
              </a>
              ) to contain the blast radius of a leaked key or a runaway retry loop.
            </p>
          </div>
        </div>
      </Section>

      <Section id="rate-limits" title="Rate limits">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2 text-left font-medium">Endpoint group</th>
                <th className="px-4 py-2 text-left font-medium">Limit</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-2">Initiating payments (MoMo, card, crypto)</td>
                <td className="px-4 py-2 font-mono text-xs">60 / min</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2">Reading payments (list/detail)</td>
                <td className="px-4 py-2 font-mono text-xs">120 / min</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Login</td>
                <td className="px-4 py-2 font-mono text-xs">10 / min</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          Exceeding a limit returns{" "}
          <code className="text-sm">429 Too Many Requests</code>.
        </p>
      </Section>

      <Section id="mobile-money" title="Mobile Money payments">
        <p className="text-muted-foreground">
          Initiates an MTN MoMo or Orange Money payment. The customer receives a push
          notification on the PayCam app and approves or declines it — funds move once they
          approve.
        </p>
        <div className="flex items-center gap-2">
          <Badge>POST</Badge>
          <code className="text-sm">/payments/initiate/</code>
        </div>
        <ParamsTable
          params={[
            { name: "amount", type: "string", required: true, description: "Amount in XAF." },
            { name: "currency", type: "string", required: true, description: '"XAF" — the only supported currency for this endpoint.' },
            { name: "payment_method", type: "string", required: true, description: '"mtn_momo" or "orange_money".' },
            { name: "phone_number", type: "string", required: true, description: "Customer's registered PayCam phone number." },
            { name: "description", type: "string", description: "Shown to the customer in the approval prompt." },
            { name: "external_reference", type: "string", description: "Your own order/reference id." },
            { name: "webhook_url", type: "string", description: "Where to send payment.pending / status-change events." },
            { name: "idempotency_key", type: "string", description: "Send the same key to safely retry a request." },
          ]}
        />
        <Callout type="tip">
          Always pass <code>idempotency_key</code> in production — see{" "}
          <a href="#security" className="text-primary hover:underline">Security</a>.
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
        <p className="text-sm text-muted-foreground">Response — 201 Created</p>
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

      <Section id="card" title="Card payments">
        <p className="text-muted-foreground">
          Initiates a card payment. Supports XAF, USD, EUR, GBP, NGN, GHS, and KES.
        </p>
        <div className="flex items-center gap-2">
          <Badge>POST</Badge>
          <code className="text-sm">/payments/card/initiate/</code>
        </div>
        <ParamsTable
          params={[
            { name: "amount", type: "string", required: true, description: "Amount in the given currency." },
            { name: "currency", type: "string", required: true, description: "XAF, USD, EUR, GBP, NGN, GHS, or KES." },
            { name: "card_number", type: "string", required: true, description: "Card number." },
            { name: "expiry_month", type: "number", required: true, description: "1–12." },
            { name: "expiry_year", type: "number", required: true, description: "e.g. 2028." },
            { name: "cvv", type: "string", required: true, description: "3-digit CVV." },
            { name: "description", type: "string", description: "Order description." },
            { name: "webhook_url", type: "string", description: "Where to send status-change events." },
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

      <Section id="crypto" title="Crypto payments">
        <p className="text-muted-foreground">
          Sends BTC, ETH, or USDT (testnet) to a PayCam-generated customer wallet address.
          The response includes a ready-to-scan QR code as a base64 PNG.
        </p>
        <Callout type="info">
          These are testnet assets with no real-world value — safe to integrate against
          freely. See{" "}
          <a href="#security" className="text-primary hover:underline">Security</a>.
        </Callout>
        <div className="flex items-center gap-2">
          <Badge>POST</Badge>
          <code className="text-sm">/payments/crypto/initiate/</code>
        </div>
        <ParamsTable
          params={[
            { name: "amount", type: "string", required: true, description: "Amount in the given crypto currency." },
            { name: "currency", type: "string", required: true, description: '"BTC", "ETH", or "USDT".' },
            { name: "crypto_wallet_address", type: "string", required: true, description: "A PayCam-generated customer testnet address." },
            { name: "description", type: "string", description: "Order description." },
            { name: "webhook_url", type: "string", description: "Where to send status-change events." },
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
          Want to try this without writing any code? Use the{" "}
          <a href="/sandbox" className="text-primary hover:underline">
            Sandbox
          </a>{" "}
          page in your dashboard — it calls these same endpoints and renders the QR code for
          you.
        </p>
      </Section>

      <Section id="retrieve" title="Retrieve & list payments">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">GET</Badge>
            <code className="text-sm">/payments/</code>
          </div>
          <p className="text-sm text-muted-foreground">
            Paginated list of every transaction for your account.
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">GET</Badge>
            <code className="text-sm">/payments/{"{reference}"}/</code>
          </div>
          <p className="text-sm text-muted-foreground">Retrieve a single transaction.</p>
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

      <Section id="webhooks" title="Webhooks">
        <p className="text-muted-foreground">
          If you pass{" "}
          <code className="text-sm">webhook_url</code>{" "}
          when initiating a payment, PayCam POSTs an event there whenever the
          transaction&apos;s status changes. Retries up to 3 times with backoff (1, 5, then 15
          minutes) if your endpoint doesn&apos;t return a 2xx.
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
          Every request carries a{" "}
          <code className="text-sm">PayCam-Signature</code>{" "}
          header shaped{" "}
          <code className="text-sm">t=&lt;timestamp&gt;,v1=&lt;signature&gt;</code>.{" "}
          Verify it with your webhook secret (from the API Keys page) before trusting the
          payload:
        </p>
        <Callout type="security" title="Never skip signature verification">
          Your webhook URL is a public endpoint. Without checking{" "}
          <code>PayCam-Signature</code>, anyone can POST a fake payload claiming a payment
          succeeded.
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
