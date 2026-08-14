/** Mirrors the Flutter app's normalization: bare 9-digit local numbers get
 * the Cameroon country code prefixed; anything already prefixed passes through. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits.startsWith("237") && digits.length === 9) return `237${digits}`;
  return digits;
}
