"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const NOTICE =
  "PayCam is a simulated payment gateway built for educational purposes. It does not process real money and is not licensed by any financial regulator. All balances, cards, and MoMo transactions are test data.";

const TERMS_SECTIONS = [
  {
    title: "1. Nature of the service",
    body: "PayCam simulates Mobile Money, card, and crypto payment flows for students to integrate against. No real MTN/Orange Money integration exists, and PayCam-owned test cards are used instead of Stripe.",
  },
  {
    title: "2. Your account",
    body: "You register with a phone number, PIN, and email. You are responsible for keeping your PIN confidential. PayCam locks your account for 10 minutes after 3 incorrect PIN or OTP attempts.",
  },
  {
    title: "3. Test funds only",
    body: "Wallet balances are credited via the sandbox faucet and are not real currency. They cannot be withdrawn, transferred off-platform, or exchanged for anything of value.",
  },
  {
    title: "4. Acceptable use",
    body: "PayCam is provided for learning and integration testing. Do not use it to represent real financial transactions to third parties.",
  },
];

const PRIVACY_SECTIONS = [
  {
    title: "1. What we collect",
    body: "Your full name, phone number, email address, and a hashed PIN. Card and crypto payment details use PayCam-owned test data only.",
  },
  {
    title: "2. How OTPs are delivered",
    body: "One-time passwords are sent to your registered email via Brevo. No SMS provider is used, and no data is shared with mobile carriers.",
  },
  {
    title: "3. Data retention",
    body: "Test account data may be reset periodically as part of maintaining this educational sandbox. Do not store anything you need permanently.",
  },
  {
    title: "4. Contact",
    body: "Questions about this policy can be directed to the project maintainers listed in the PayCam repository.",
  },
];

function Sections({ items }: { items: typeof TERMS_SECTIONS }) {
  return (
    <div className="space-y-6">
      {items.map((section) => (
        <div key={section.title}>
          <h3 className="text-sm font-bold">{section.title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{section.body}</p>
        </div>
      ))}
    </div>
  );
}

export default function LegalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Terms & Privacy</h1>
        <p className="text-sm text-muted-foreground">PayCam — Educational Project · Version 3.0.0</p>
      </div>
      <div className="rounded-lg bg-muted p-4 text-sm font-medium">{NOTICE}</div>
      <Tabs defaultValue="terms">
        <TabsList className="w-full">
          <TabsTrigger value="terms" className="flex-1">
            Terms of Service
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex-1">
            Privacy Policy
          </TabsTrigger>
        </TabsList>
        <TabsContent value="terms" className="pt-6">
          <Sections items={TERMS_SECTIONS} />
        </TabsContent>
        <TabsContent value="privacy" className="pt-6">
          <Sections items={PRIVACY_SECTIONS} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
