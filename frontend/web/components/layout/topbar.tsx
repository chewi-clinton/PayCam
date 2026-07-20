"use client";

import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { merchant, logout } = useAuth();

  const initials = merchant
    ? `${merchant.first_name[0] ?? ""}${merchant.last_name[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-4 py-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src="/brand/avatar.png" alt="" />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden sm:block text-sm leading-tight">
          <p className="font-medium">
            {merchant?.first_name} {merchant?.last_name}
          </p>
          <p className="text-muted-foreground">{merchant?.email}</p>
        </div>
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
