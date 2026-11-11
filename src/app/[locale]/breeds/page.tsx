import type { Metadata } from "next";
import { PawPrint } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { BreedCard } from "@/features/breeds/components/breed-card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getBreeds } from "@/server/services/breed-service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "breeds" });
  return { title: t("title") };
}

export default async function BreedsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ species?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { species } = await searchParams;
  const t = await getTranslations("breeds");

  const activeSpecies =
    species === "DOG" || species === "CAT" || species === "OTHER" ? species : undefined;
  const breeds = await getBreeds(activeSpecies);

  const pillClass = (active: boolean) =>
    cn(
      "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
      active ? "border-brand bg-brand text-white" : "border-border bg-card hover:bg-secondary",
    );

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link href="/breeds" className={pillClass(!activeSpecies)}>
          {t("filterAll")}
        </Link>
        <Link href="/breeds?species=DOG" className={pillClass(activeSpecies === "DOG")}>
          {t("speciesDog")}
        </Link>
        <Link href="/breeds?species=CAT" className={pillClass(activeSpecies === "CAT")}>
          {t("speciesCat")}
        </Link>
      </div>

      {breeds.length === 0 ? (
        <EmptyState icon={PawPrint} title={t("emptyTitle")} description={t("emptyDesc")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {breeds.map((breed) => (
            <BreedCard key={breed.slug} breed={breed} />
          ))}
        </div>
      )}
    </div>
  );
}
