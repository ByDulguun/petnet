import { NextRequest } from "next/server";

import { handlers } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const { GET } = handlers;

// Wraps NextAuth's own POST handler rather than rate-limiting inside
// Credentials.authorize(): that callback can't control the wrapping HTTP
// status (Auth.js keeps its own 200/302 semantics regardless of what's
// thrown there), so a real 429 has to come from in front of it. This is
// still the actual endpoint the credentials sign-in POSTs to — there's no
// path that reaches authorize() without going through this handler first.
export async function POST(request: NextRequest) {
  if (request.nextUrl.pathname.endsWith("/callback/credentials")) {
    const ip = getClientIp(request);
    const result = await checkRateLimit(`login:${ip}`, { limit: 10, windowMs: 5 * 60 * 1000 });
    if (!result.allowed) return rateLimitResponse(result.retryAfterSeconds!);
  }

  return handlers.POST(request);
}
