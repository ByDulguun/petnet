import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { MapExplorer } from "@/features/services/components/map-explorer";
import type { ExplorerFilters } from "@/features/services/hooks";
import { AMENITIES, CATEGORIES, DISTRICTS } from "@/server/data/taxonomy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("mapTitle"),
    description: t("mapDescription"),
    alternates: {
      canonical: `/${locale}/map`,
      languages: { mn: "/mn/map", en: "/en/map" },
    },
  };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function MapPage({
  params: pageParams,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await pageParams;
  setRequestLocale(locale);
  const params = await searchParams;

  const initialFilters: Partial<ExplorerFilters> = {
    q: first(params.q) ?? "",
    category: CATEGORIES.some((c) => c.slug === first(params.category))
      ? first(params.category)
      : undefined,
    district: DISTRICTS.includes(first(params.district) as (typeof DISTRICTS)[number])
      ? first(params.district)
      : undefined,
    openNow: first(params.openNow) === "1",
    open24h: first(params.open24h) === "1",
    minRating: first(params.rating) ? Number(first(params.rating)) : undefined,
    amenities: first(params.amenities)?.split(",").filter(Boolean) ?? [],
    priceLevels:
      first(params.price)
        ?.split(",")
        .map(Number)
        .filter((n) => n >= 1 && n <= 4) ?? [],
    verifiedOnly: first(params.verified) === "1",
    sort: (["relevance", "rating", "reviews", "distance", "name"] as const).includes(
      first(params.sort) as never,
    )
      ? (first(params.sort) as ExplorerFilters["sort"])
      : "relevance",
  };

  return (
    <MapExplorer
      initialFilters={initialFilters}
      categories={CATEGORIES.map(({ slug, name, icon }) => ({ slug, name, icon }))}
      districts={[...DISTRICTS]}
      amenities={AMENITIES}
    />
  );
}
