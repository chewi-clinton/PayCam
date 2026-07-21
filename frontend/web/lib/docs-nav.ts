export type DocsNavItem = { id: string; labelKey: string };
export type DocsNavGroup = { groupKey: string; items: DocsNavItem[] };

export const DOCS_NAV: DocsNavGroup[] = [
  {
    groupKey: "docs.nav.getStarted",
    items: [
      { id: "introduction", labelKey: "docs.nav.introduction" },
      { id: "authentication", labelKey: "docs.nav.authentication" },
    ],
  },
  {
    groupKey: "docs.nav.coreConcepts",
    items: [
      { id: "errors", labelKey: "docs.nav.errors" },
      { id: "security", labelKey: "docs.nav.security" },
      { id: "rate-limits", labelKey: "docs.nav.rateLimits" },
    ],
  },
  {
    groupKey: "docs.nav.apiReference",
    items: [
      { id: "mobile-money", labelKey: "docs.nav.mobileMoney" },
      { id: "card", labelKey: "docs.nav.card" },
      { id: "crypto", labelKey: "docs.nav.crypto" },
      { id: "retrieve", labelKey: "docs.nav.retrieve" },
    ],
  },
  {
    groupKey: "docs.nav.webhooksGroup",
    items: [{ id: "webhooks", labelKey: "docs.nav.webhooks" }],
  },
];

export const DOCS_NAV_FLAT: DocsNavItem[] = DOCS_NAV.flatMap((g) => g.items);
