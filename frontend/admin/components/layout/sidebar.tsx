"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Users, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

const NAV_ITEMS = [
  { href: "/merchants", key: "merchants", icon: Users },
  { href: "/invites", key: "invites", icon: UserPlus },
] as const;

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <>
      <div className="flex items-center gap-2.5 px-6 py-5">
        <Image src="/brand/logo-badge-black.png" alt="PayCam" width={28} height={28} className="rounded-md" />
        <span className="text-lg font-semibold">PayCam Admin</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {t(`nav.${key}`)}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function Sidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  return (
    <>
      {/* Desktop: static sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar">
        <Nav />
      </aside>

      {/* Mobile: backdrop + slide-in drawer */}
      <div
        aria-hidden={!mobileOpen}
        onClick={onMobileClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar shadow-xl transition-transform duration-300 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Nav onNavigate={onMobileClose} />
      </aside>
    </>
  );
}
