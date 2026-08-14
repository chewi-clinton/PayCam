import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

export function MenuItem({
  href,
  icon: Icon,
  title,
  subtitle,
  trailing,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {trailing ?? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </Link>
  );
}
