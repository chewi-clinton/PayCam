export function formatAmount(amount: string, currency: string): string {
  const value = Number(amount);
  if (currency === "XAF") {
    return `${new Intl.NumberFormat("en-US").format(value)} XAF`;
  }
  return `${value} ${currency}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function paymentMethodLabel(method: string, language: "en" | "fr" = "en"): string {
  const labels: Record<string, Record<string, string>> = {
    en: {
      mtn_momo: "MTN MoMo",
      orange_money: "Orange Money",
      card: "Card",
      crypto_btc: "Bitcoin",
      crypto_eth: "Ethereum",
      crypto_usdt: "USDT",
    },
    fr: {
      mtn_momo: "MTN MoMo",
      orange_money: "Orange Money",
      card: "Carte",
      crypto_btc: "Bitcoin",
      crypto_eth: "Ethereum",
      crypto_usdt: "USDT",
    },
  };
  return labels[language][method] ?? method;
}
