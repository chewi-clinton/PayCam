"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";

export function Topbar() {
  const { merchant, logout } = useAuth();

  const initials = merchant
    ? `${merchant.first_name[0] ?? ""}${merchant.last_name[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
      <Badge variant="outline" className="text-success border-success/30 bg-success/10">
        Live
      </Badge>
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
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
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
