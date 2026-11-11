import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a price in Mongolian tögrög: 45000 -> "45,000₮" */
export function formatMnt(amount: number): string {
  return `${new Intl.NumberFormat("en-US").format(amount)}₮`;
}

/** Whether a `?next=` value is safe to redirect to after login/register —
 * i.e. definitely an in-app path, not something a browser would treat as an
 * absolute/protocol-relative URL. `next.startsWith("/")` alone isn't
 * enough: "//evil.com" and "/\evil.com" both start with "/" but browsers
 * resolve them as cross-origin. Client-safe (no server-only imports) so
 * both server pages and client forms can share one definition. */
export function isSafeRedirectPath(next: string | null | undefined): next is string {
  return Boolean(next) && next!.startsWith("/") && !next!.startsWith("//") && !next!.includes("\\");
}

/** Serializes a JSON-LD object for a `<script type="application/ld+json">`
 * tag. `JSON.stringify` alone doesn't escape `<`, so a value containing
 * `</script>` (e.g. a business name/description, which are user-editable)
 * can close the script tag early and inject arbitrary HTML into the page.
 * Escaping `<` to its unicode form neutralizes that without changing the
 * parsed JSON value. Always use this instead of raw `JSON.stringify` when
 * building `dangerouslySetInnerHTML` for structured data. */
export function toSafeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** "2y 3m" style age from a birthday. */
export function formatPetAge(birthday: Date | string): string {
  const birth = typeof birthday === "string" ? new Date(birthday) : birthday;
  const now = new Date();
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 1) return "Newborn";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} mo`;
  if (rest === 0) return `${years} yr${years > 1 ? "s" : ""}`;
  return `${years}y ${rest}m`;
}
