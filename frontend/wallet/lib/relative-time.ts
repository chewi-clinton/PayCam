export function relativeTime(iso: string, justNowLabel: string, language: "en" | "fr"): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return justNowLabel;
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", {
    month: "short",
    day: "numeric",
  });
}
