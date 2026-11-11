"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";

/**
 * "3 minutes ago"-style text for a client component that gets SSR'd. Never
 * compute formatDistanceToNow directly in render — the server renders it at
 * request time and the client re-evaluates it at hydration time, and those
 * two clock reads are virtually never identical, producing a guaranteed
 * React hydration-mismatch warning. Rendering nothing until after mount
 * keeps the server and first client render identical, then fills in the
 * real value a tick later once hydration has already settled.
 */
export function RelativeTime({ date, className }: { date: Date | string; className?: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    setText(formatDistanceToNowStrict(new Date(date), { addSuffix: true }));
  }, [date]);

  return <span className={className}>{text ?? " "}</span>;
}
