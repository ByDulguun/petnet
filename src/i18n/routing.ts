import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["mn", "en"],
  // Mongolia-first platform
  defaultLocale: "mn",
  // /mn/... and /en/... — explicit, shareable, SEO-friendly
  localePrefix: "always",
  // remember the visitor's choice; first visit falls back to Accept-Language
  localeDetection: true,
});

export type Locale = (typeof routing.locales)[number];
