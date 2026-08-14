"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

const FAQ_EN = [
  {
    q: "Is this real money?",
    a: "No. PayCam is an educational sandbox — all balances, cards, and Mobile Money transactions are test data.",
  },
  {
    q: "Why can't I send money to another PayCam user?",
    a: "PayCam's API only supports merchant-initiated payments to your wallet, not direct transfers to other customers.",
  },
  {
    q: "How do I approve a payment?",
    a: "Scan a merchant's QR code, or check the Payment Requests list from the bell icon on Home, then approve or decline.",
  },
  { q: "I forgot my PIN — can I reset it?", a: "There's no self-service reset. Contact support with your registered email." },
];

const FAQ_FR = [
  {
    q: "Est-ce de l'argent réel ?",
    a: "Non. PayCam est un bac à sable éducatif — tous les soldes, cartes et transactions Mobile Money sont des données de test.",
  },
  {
    q: "Pourquoi ne puis-je pas envoyer d'argent à un autre utilisateur PayCam ?",
    a: "L'API PayCam ne prend en charge que les paiements initiés par les marchands vers votre portefeuille, pas les transferts directs entre clients.",
  },
  {
    q: "Comment approuver un paiement ?",
    a: "Scannez le code QR d'un marchand, ou consultez la liste des demandes de paiement depuis l'icône de cloche sur l'accueil, puis approuvez ou refusez.",
  },
  { q: "J'ai oublié mon PIN — puis-je le réinitialiser ?", a: "Il n'y a pas de réinitialisation en libre-service. Contactez le support avec votre e-mail enregistré." },
];

export default function HelpCenterPage() {
  const { t, language } = useLanguage();
  const faq = language === "fr" ? FAQ_FR : FAQ_EN;

  return (
    <div className="space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("settings.title")}
      </Link>

      <h1 className="text-xl font-semibold">{t("settings.helpCenter")}</h1>

      <div className="space-y-2">
        {faq.map((item) => (
          <details key={item.q} className="group rounded-lg border border-border p-3">
            <summary className="cursor-pointer list-none text-sm font-medium">{item.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>

      <a
        href="mailto:support@paycam.cm"
        className="flex items-center justify-center gap-2 rounded-lg border border-border p-3 text-sm text-primary"
      >
        <Mail className="h-4 w-4" />
        support@paycam.cm
      </a>
    </div>
  );
}
