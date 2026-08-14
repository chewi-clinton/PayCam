"use client";

import { BalanceCard } from "@/components/wallet/balance-card";
import { CryptoWalletCard } from "@/components/wallet/crypto-wallet-card";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";

export default function WalletPage() {
  const { wallet, cryptoWallets } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t("wallet.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("wallet.subtitle")}</p>
      </div>

      <BalanceCard wallet={wallet} />

      <div>
        <h2 className="mb-2 text-sm font-semibold">{t("wallet.cryptoWallets")}</h2>
        {cryptoWallets.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t("wallet.noCryptoWallets")}
          </p>
        ) : (
          <div className="space-y-3">
            {cryptoWallets.map((cw) => (
              <CryptoWalletCard key={cw.currency} wallet={cw} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
