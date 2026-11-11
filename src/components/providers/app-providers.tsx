"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

import { TooltipProvider } from "@/components/ui/tooltip";

// SessionProvider (client-side) rather than reading the session in the root
// server layout: Home and the business detail page are statically generated,
// so a session fetched at layout render time would get baked into the
// cached HTML and never reflect the actual visitor. useSession() in the
// header fetches /api/auth/session after hydration instead.
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MotionConfig reducedMotion="user">
            <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          </MotionConfig>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
