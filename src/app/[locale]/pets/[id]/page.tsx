import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PetForm } from "@/features/pets/components/pet-form";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getPetById } from "@/server/services/pet-service";

// Owner-specific, ownership-checked — never prerender or cache this route.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "pets" });
  const user = await requireUser(`/pets/${id}`);
  const pet = await getPetById(id, user.id);
  return { title: pet ? t("editTitle", { name: pet.name }) : t("title") };
}

export default async function EditPetPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireUser(`/pets/${id}`);
  const t = await getTranslations("pets");

  const [pet, breeds] = await Promise.all([
    getPetById(id, user.id),
    prisma.breed.findMany({
      select: { id: true, name: true, species: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!pet) notFound();

  return (
    <div className="container-page max-w-lg py-10 lg:py-14">
      <Link
        href="/pets"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("backToPets")}
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t("editTitle", { name: pet.name })}
      </h1>
      <PetForm
        breeds={breeds}
        initial={{
          id: pet.id,
          name: pet.name,
          species: pet.species,
          gender: pet.gender,
          breedId: pet.breedId,
          birthday: pet.birthday ? pet.birthday.toISOString().slice(0, 10) : "",
          avatarUrl: pet.avatarUrl,
        }}
      />
    </div>
  );
}
