import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations/auth";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const ip = getClientIp(request);
  const limit = await checkRateLimit(`register:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds!);

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid registration", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      {
        error: "An account with this email already exists",
        issues: { email: ["Already registered"] },
      },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name, email, passwordHash, phone: phone || undefined },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
});
