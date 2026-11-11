import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PetForm } from "@/features/pets/components/pet-form";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

// Protected, form-only page — never prerender or cache this route.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pets" });
  return { title: t("newTitle") };
}

export default async function NewPetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser("/pets/new");
  const t = await getTranslations("pets");
  const breeds = await prisma.breed.findMany({
    select: { id: true, name: true, species: true },
    orderBy: { name: "asc" },
  });

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
        {t("newTitle")}
      </h1>
      <PetForm breeds={breeds} />
    </div>
  );
}
