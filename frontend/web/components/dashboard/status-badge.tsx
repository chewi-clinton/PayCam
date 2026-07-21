"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

const STYLES: Record<string, string> = {
  success: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/30",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  expired: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", STYLES[status])}>
      {STYLES[status] ? t(`status.${status}`) : status}
    </Badge>
  );
}
