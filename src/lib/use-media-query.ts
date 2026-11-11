"use client";

import { useEffect, useState } from "react";

/** Tracks whether a CSS media query currently matches. Starts `false` on
 * the server and first client render (avoids a hydration mismatch), then
 * syncs to the real value in an effect and on subsequent changes. Callers
 * that need to avoid double-mounting expensive content per breakpoint
 * (e.g. rendering only one of a desktop/mobile layout instead of both,
 * CSS-hidden) should gate on this instead of relying on `hidden`/`lg:hidden`
 * classes alone, which mount both branches regardless of viewport. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
