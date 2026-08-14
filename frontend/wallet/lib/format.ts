export function formatAmount(amount: string | number, currency: string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (currency === "XAF") {
    return `XAF ${new Intl.NumberFormat("en-US").format(Math.round(value))}`;
  }
  if (currency === "BTC") return `${value.toFixed(8)} BTC`;
  if (currency === "ETH") return `${value.toFixed(6)} ETH`;
  if (currency === "USDT") return `${value.toFixed(2)} USDT`;
  return `${currency} ${value.toFixed(2)}`;
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

/** Applied to every amount, wallet address, and reference — matches the Flutter
 * app's monoNumeric() convention so numerals line up visually. */
export const monoNumeric = "font-mono tabular-nums";
