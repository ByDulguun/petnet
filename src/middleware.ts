import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

// Detects the locale (cookie → Accept-Language → default), redirects
// unprefixed paths and persists the choice in the NEXT_LOCALE cookie.
export default createMiddleware(routing);

export const config = {
  // all pages except API routes, Next internals and static files
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
