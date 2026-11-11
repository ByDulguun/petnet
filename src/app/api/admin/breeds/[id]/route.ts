import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import {
  CloudinaryConfigError,
  configErrorResponse,
  imageValidationErrorResponse,
  uploadImage,
  validateImageUpload,
} from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { breedInputSchema } from "@/lib/validations/breeds";
import { deleteBreed, updateBreed } from "@/server/services/breed-service";

async function requireAdminApi(userId: string) {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return me?.role === "ADMIN";
}

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!(await requireAdminApi(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const parsed = breedInputSchema.safeParse({
    name: formData.get("name") ?? "",
    nameMn: formData.get("nameMn") ?? "",
    species: formData.get("species") ?? "",
    summary: formData.get("summary") ?? "",
    history: formData.get("history") ?? "",
    temperament: formData.get("temperament") ?? "",
    exerciseNeeds: formData.get("exerciseNeeds") ? Number(formData.get("exerciseNeeds")) : undefined,
    groomingNeeds: formData.get("groomingNeeds") ? Number(formData.get("groomingNeeds")) : undefined,
    trainability: formData.get("trainability") ? Number(formData.get("trainability")) : undefined,
    friendliness: formData.get("friendliness") ? Number(formData.get("friendliness")) : undefined,
    sheddingLevel: formData.get("sheddingLevel") ? Number(formData.get("sheddingLevel")) : undefined,
    nutrition: formData.get("nutrition") ?? "",
    healthOverview: formData.get("healthOverview") ?? "",
    commonDiseases: formData.get("commonDiseases") ?? "",
    lifeExpectancy: formData.get("lifeExpectancy") ?? "",
    weightRange: formData.get("weightRange") ?? "",
    heightRange: formData.get("heightRange") ?? "",
    pros: formData.get("pros") ?? "",
    cons: formData.get("cons") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const coverFile = formData.get("cover");
  let coverImage: string | undefined;
  if (coverFile instanceof File && coverFile.size > 0) {
    const validated = await validateImageUpload(coverFile);
    if (!validated.ok) return imageValidationErrorResponse(validated.error);
    try {
      const { url } = await uploadImage(validated.image.buffer, "petnet/breeds", `${id}-${Date.now()}`);
      coverImage = url;
    } catch (err) {
      if (err instanceof CloudinaryConfigError) return configErrorResponse();
      throw err;
    }
  }

  const breed = await updateBreed(id, {
    name: parsed.data.name,
    nameMn: parsed.data.nameMn || null,
    species: parsed.data.species,
    summary: parsed.data.summary,
    history: parsed.data.history || null,
    temperament: parsed.data.temperament,
    exerciseNeeds: parsed.data.exerciseNeeds ?? null,
    groomingNeeds: parsed.data.groomingNeeds ?? null,
    trainability: parsed.data.trainability ?? null,
    friendliness: parsed.data.friendliness ?? null,
    sheddingLevel: parsed.data.sheddingLevel ?? null,
    nutrition: parsed.data.nutrition || null,
    healthOverview: parsed.data.healthOverview || null,
    commonDiseases: parsed.data.commonDiseases,
    lifeExpectancy: parsed.data.lifeExpectancy || null,
    weightRange: parsed.data.weightRange || null,
    heightRange: parsed.data.heightRange || null,
    pros: parsed.data.pros,
    cons: parsed.data.cons,
    coverImage,
  });
  if (!breed) return NextResponse.json({ error: "Breed not found" }, { status: 404 });

  return NextResponse.json({ breed });
});

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!(await requireAdminApi(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ok = await deleteBreed(id);
  if (!ok) return NextResponse.json({ error: "Breed not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
});
