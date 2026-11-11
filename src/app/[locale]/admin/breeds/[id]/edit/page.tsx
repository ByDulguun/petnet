import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BreedForm } from "@/features/breeds/components/breed-form";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/session";
import { getBreedById } from "@/server/services/breed-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminBreeds" });
  return { title: t("editTitle") };
}

export default async function EditBreedPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(`/admin/breeds/${id}/edit`);
  const t = await getTranslations("adminBreeds");

  const breed = await getBreedById(id);
  if (!breed) notFound();

  return (
    <div className="container-page max-w-lg py-10 lg:py-14">
      <Link
        href="/admin/breeds"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("backToList")}
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">{t("editTitle")}</h1>
      <BreedForm
        initial={{
          id: breed.id,
          name: breed.name,
          nameMn: breed.nameMn ?? "",
          species: breed.species,
          summary: breed.summary,
          history: breed.history ?? "",
          temperament: breed.temperament.join(", "),
          exerciseNeeds: breed.exerciseNeeds != null ? String(breed.exerciseNeeds) : "",
          groomingNeeds: breed.groomingNeeds != null ? String(breed.groomingNeeds) : "",
          trainability: breed.trainability != null ? String(breed.trainability) : "",
          friendliness: breed.friendliness != null ? String(breed.friendliness) : "",
          sheddingLevel: breed.sheddingLevel != null ? String(breed.sheddingLevel) : "",
          nutrition: breed.nutrition ?? "",
          healthOverview: breed.healthOverview ?? "",
          commonDiseases: breed.commonDiseases.join(", "),
          lifeExpectancy: breed.lifeExpectancy ?? "",
          weightRange: breed.weightRange ?? "",
          heightRange: breed.heightRange ?? "",
          pros: breed.pros.join(", "),
          cons: breed.cons.join(", "),
          coverImage: breed.coverImage,
        }}
      />
    </div>
  );
}
