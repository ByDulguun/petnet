import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { petInputSchema } from "@/lib/validations/pets";
import { deletePet, getPetById, updatePet } from "@/server/services/pet-service";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const pet = await getPetById(id, session.user.id);
  if (!pet) {
    // Same 404 whether the pet doesn't exist or belongs to someone else —
    // never confirm another user's pet id exists.
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  return NextResponse.json({ pet });
});

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = petInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid pet details", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, species, gender, breedId, birthday, avatarUrl } = parsed.data;
  const pet = await updatePet(id, session.user.id, {
    name,
    species,
    gender,
    breedId: breedId || null,
    birthday: birthday ? new Date(`${birthday}T00:00:00Z`) : null,
    avatarUrl: avatarUrl || null,
  });

  if (!pet) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  return NextResponse.json({ pet });
});

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deletePet(id, session.user.id);
  if (!ok) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
});
