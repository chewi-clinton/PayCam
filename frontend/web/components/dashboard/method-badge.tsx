"use client";

import { paymentMethodLabel } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/language-context";

const DOT_COLORS: Record<string, string> = {
  mtn_momo: "bg-mtn",
  orange_money: "bg-orange-momo",
  card: "bg-foreground/60",
  crypto_btc: "bg-btc",
  crypto_eth: "bg-eth",
  crypto_usdt: "bg-usdt",
};

export function MethodBadge({ method }: { method: string }) {
  const { language } = useLanguage();
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={`h-2 w-2 rounded-full ${DOT_COLORS[method] ?? "bg-muted-foreground"}`} />
      {paymentMethodLabel(method, language)}
    </span>
  );
}
