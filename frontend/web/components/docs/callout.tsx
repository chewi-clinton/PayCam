import { Info, TriangleAlert, Lightbulb, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES = {
  info: {
    icon: Info,
    className: "border-blue-500/30 bg-blue-500/5 text-blue-900 dark:text-blue-100",
    iconClassName: "text-blue-500",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-warning/30 bg-warning/5 text-amber-900 dark:text-amber-100",
    iconClassName: "text-warning",
  },
  tip: {
    icon: Lightbulb,
    className: "border-success/30 bg-success/5 text-foreground",
    iconClassName: "text-success",
  },
  security: {
    icon: ShieldCheck,
    className: "border-destructive/30 bg-destructive/5 text-foreground",
    iconClassName: "text-destructive",
  },
} as const;

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: keyof typeof STYLES;
  title?: string;
  children: React.ReactNode;
}) {
  const { icon: Icon, className, iconClassName } = STYLES[type];

  return (
    <div className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", className)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClassName)} />
      <div className="space-y-1">
        {title && <p className="font-medium">{title}</p>}
        <div className="text-muted-foreground [&_code]:text-foreground">{children}</div>
      </div>
    </div>
  );
}
