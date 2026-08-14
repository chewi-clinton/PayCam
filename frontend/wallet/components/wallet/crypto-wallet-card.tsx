"use client";

import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatAmount, monoNumeric } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/language-context";
import type { CryptoWallet } from "@/lib/api-client";

const ACCENT: Record<CryptoWallet["currency"], string> = {
  BTC: "bg-btc/10 text-btc",
  ETH: "bg-eth/10 text-eth",
  USDT: "bg-usdt/10 text-usdt",
};

export function CryptoWalletCard({ wallet }: { wallet: CryptoWallet }) {
  const { t } = useLanguage();

  const copyAddress = async () => {
    await navigator.clipboard.writeText(wallet.testnet_address);
    toast.success(t("common.copied"));
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ACCENT[wallet.currency]}`}>
          {wallet.currency}
        </span>
        <div className="text-right">
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground">{t("wallet.balance")}</p>
          <p className={`text-sm font-semibold ${monoNumeric}`}>{formatAmount(wallet.balance, wallet.currency)}</p>
        </div>
      </div>
      <div className="mt-3">
        <p className="text-[10px] font-medium tracking-wide text-muted-foreground">{t("wallet.receiveAddress")}</p>
        <button
          type="button"
          onClick={copyAddress}
          className={`mt-0.5 flex w-full cursor-pointer items-center gap-1.5 truncate text-left text-xs ${monoNumeric}`}
        >
          <span className="truncate">{wallet.testnet_address}</span>
          <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </div>
    </Card>
  );
}
