import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

const STYLES: Record<string, string> = {
  success: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  failed: "bg-destructive/10 text-destructive",
  expired: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STYLES[status] ?? STYLES.expired
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}
