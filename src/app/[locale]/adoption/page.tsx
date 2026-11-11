import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { AdoptionCard } from "@/features/adoption/components/adoption-card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getAdoptionListings } from "@/server/services/adoption-service";

// Listings and their statuses change any time — never prerender or cache.
export const dynamic = "force-dynamic";

const SPECIES_KEY = { DOG: "speciesDog", CAT: "speciesCat", OTHER: "speciesOther" } as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adoption" });
  return { title: t("title") };
}

export default async function AdoptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ species?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { species } = await searchParams;
  const t = await getTranslations("adoption");

  const activeSpecies =
    species === "DOG" || species === "CAT" || species === "OTHER" ? species : undefined;

  const listings = await getAdoptionListings({ species: activeSpecies });

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
        <Link href="/adoption" className={pillClass(!activeSpecies)}>
          {t("filterAll")}
        </Link>
        {(["DOG", "CAT", "OTHER"] as const).map((s) => (
          <Link
            key={s}
            href={activeSpecies === s ? "/adoption" : `/adoption?species=${s}`}
            className={pillClass(activeSpecies === s)}
          >
            {t(SPECIES_KEY[s])}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <EmptyState icon={Heart} title={t("emptyTitle")} description={t("emptyDesc")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <AdoptionCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
