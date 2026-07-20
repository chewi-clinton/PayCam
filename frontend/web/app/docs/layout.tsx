"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { DocsProvider } from "@/lib/docs-context";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <DocsProvider>
      <div className="flex h-screen flex-col bg-background">
        <header className="z-40 flex shrink-0 items-center justify-between border-b border-border bg-background px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen((v) => !v)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/brand/logo-badge-black.png" alt="PayCam" width={26} height={26} className="rounded-md" />
              <span className="text-base font-semibold">PayCam Docs</span>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Go to Dashboard →
            </Link>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-border px-3 py-6 lg:block">
            <DocsSidebar />
          </aside>

          {/* Mobile drawer */}
          <div
            aria-hidden={!mobileNavOpen}
            onClick={() => setMobileNavOpen(false)}
            className={cn(
              "fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 lg:hidden",
              mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          />
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto border-r border-border bg-background px-3 py-6 shadow-xl transition-transform duration-300 ease-out lg:hidden",
              mobileNavOpen ? "translate-x-0" : "-translate-x-full"
            )}
            style={{ top: "57px" }}
          >
            <div onClick={() => setMobileNavOpen(false)}>
              <DocsSidebar />
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </DocsProvider>
  );
}
