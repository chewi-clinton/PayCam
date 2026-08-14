"use client";

import { TransactionRow } from "./transaction-row";
import { useLanguage } from "@/lib/i18n/language-context";
import type { AppTransaction } from "@/lib/api-client";

function dayLabel(iso: string, t: (path: string) => string, language: "en" | "fr"): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(date, today)) return t("history.today");
  if (sameDay(date, yesterday)) return t("history.yesterday");
  return date.toLocaleDateString(language === "fr" ? "fr-FR" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function TransactionList({ transactions }: { transactions: AppTransaction[] }) {
  const { t, language } = useLanguage();

  const groups = new Map<string, AppTransaction[]>();
  for (const txn of transactions) {
    const label = dayLabel(txn.created_at, t, language);
    const existing = groups.get(label) ?? [];
    existing.push(txn);
    groups.set(label, existing);
  }

  return (
    <div className="space-y-5">
      {Array.from(groups.entries()).map(([label, items]) => (
        <div key={label}>
          <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{label}</h3>
          <div className="space-y-2">
            {items.map((txn) => (
              <TransactionRow key={txn.reference} transaction={txn} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
