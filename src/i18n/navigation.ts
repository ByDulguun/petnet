import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// Locale-aware replacements for next/link and next/navigation primitives.
// Every internal link in the app must use these so /mn and /en are preserved.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
