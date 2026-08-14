/** Web Share API when available, clipboard fallback otherwise (desktop browsers).
 * If the user dismisses the native share sheet, that's a deliberate cancel —
 * we don't silently fall back to clipboard in that case. */
export async function shareText(title: string, text: string): Promise<"shared" | "cancelled" | "copied"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch {
      return "cancelled";
    }
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}
