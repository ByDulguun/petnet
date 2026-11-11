import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { petInputSchema } from "@/lib/validations/pets";
import { createPet, getPetsForUser } from "@/server/services/pet-service";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const pets = await getPetsForUser(session.user.id);
  return NextResponse.json({ pets });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = petInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid pet details", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, species, gender, breedId, birthday, avatarUrl } = parsed.data;
  const pet = await createPet(session.user.id, {
    name,
    species,
    gender,
    breedId: breedId || null,
    birthday: birthday ? new Date(`${birthday}T00:00:00Z`) : null,
    avatarUrl: avatarUrl || null,
  });

  return NextResponse.json({ pet }, { status: 201 });
});
