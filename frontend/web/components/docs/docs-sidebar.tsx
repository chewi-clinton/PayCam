"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOCS_NAV } from "@/lib/docs-nav";
import { useDocs } from "@/lib/docs-context";

export function DocsSidebar() {
  const { activeSection, setActiveSection } = useDocs();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return DOCS_NAV;
    const q = query.toLowerCase();
    return DOCS_NAV.map((g) => ({
      ...g,
      items: g.items.filter((item) => item.label.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative px-1 pb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search docs..."
          className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-1 pb-8">
        {filtered.map((g) => (
          <div key={g.group}>
            <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {g.group}
            </p>
            <div className="space-y-0.5">
              {g.items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "block rounded-md px-3 py-1.5 text-sm transition-colors",
                    activeSection === item.id
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 text-sm text-muted-foreground">No results.</p>
        )}
      </nav>
    </div>
  );
}
