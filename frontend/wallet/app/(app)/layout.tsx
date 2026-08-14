"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { TransactionsProvider } from "@/lib/transactions-context";
import { PinRelockProvider } from "@/lib/pin-relock-context";
import { RelockOverlay } from "@/components/pin/relock-overlay";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useLanguage } from "@/lib/i18n/language-context";

function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/welcome");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        {t("appShell.loading")}
      </div>
    );
  }

  return (
    <TransactionsProvider>
      <PinRelockProvider>
        <div className="mx-auto min-h-screen w-full max-w-md px-4 py-6 pb-24">{children}</div>
        <BottomNav />
        <RelockOverlay />
      </PinRelockProvider>
    </TransactionsProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Guard>{children}</Guard>
    </AuthProvider>
  );
}
