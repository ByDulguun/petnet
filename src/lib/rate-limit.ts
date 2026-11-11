import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/**
 * Postgres-backed rate limiter — not an in-memory Map. A per-process
 * counter would reset on every cold start and wouldn't be shared across
 * server instances, so it would silently stop limiting anything in a real
 * deployment. The database is already the one piece of shared state this
 * app has, so it's the simplest thing that's actually correct in
 * production, without adding a new service (Redis/Upstash) for one job.
 *
 * There's a small TOCTOU window between the count and the insert under
 * heavy concurrency — acceptable slop for abuse-prevention, not a
 * financial control.
 */
export async function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowMs);

  const [count] = await Promise.all([
    prisma.rateLimitHit.count({ where: { key, createdAt: { gte: windowStart } } }),
    // Opportunistic cleanup so the table doesn't grow unbounded — no cron
    // needed. ~1% of calls sweep hits old enough that no realistic window
    // still cares about them.
    Math.random() < 0.01
      ? prisma.rateLimitHit.deleteMany({
          where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        })
      : Promise.resolve(),
  ]);

  if (count >= limit) {
    const oldest = await prisma.rateLimitHit.findFirst({
      where: { key, createdAt: { gte: windowStart } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const retryAfterMs = oldest ? oldest.createdAt.getTime() + windowMs - Date.now() : windowMs;
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  await prisma.rateLimitHit.create({ data: { key } });
  return { allowed: true };
}

/** Best-effort caller IP from proxy headers — good enough to key a rate
 * limit bucket, not meant to be a verified identity. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: `Too many requests — try again in ${retryAfterSeconds}s` },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
