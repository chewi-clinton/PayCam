export type DocsNavItem = { id: string; label: string };
export type DocsNavGroup = { group: string; items: DocsNavItem[] };

export const DOCS_NAV: DocsNavGroup[] = [
  {
    group: "Get Started",
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "authentication", label: "Authentication" },
    ],
  },
  {
    group: "Core Concepts",
    items: [
      { id: "errors", label: "Errors" },
      { id: "security", label: "Security" },
      { id: "rate-limits", label: "Rate limits" },
    ],
  },
  {
    group: "API Reference",
    items: [
      { id: "mobile-money", label: "Mobile Money payments" },
      { id: "card", label: "Card payments" },
      { id: "crypto", label: "Crypto payments" },
      { id: "retrieve", label: "Retrieve & list payments" },
    ],
  },
  {
    group: "Webhooks",
    items: [{ id: "webhooks", label: "Webhooks" }],
  },
];

export const DOCS_NAV_FLAT: DocsNavItem[] = DOCS_NAV.flatMap((g) => g.items);
