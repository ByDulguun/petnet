import { setRequestLocale } from "next-intl/server";

import { CategoryGrid, Hero, HomeCta, PopularShops } from "@/features/home";
import type { BusinessSummary } from "@/lib/types";
import { searchBusinesses } from "@/server/services/business-service";

// Community, Adoption, Articles and Events sections are intentionally out of
// scope for the current MVP pass (see MVP plan) — their components stay in
// src/features/home for when those routes ship, just unused here for now.
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // PopularShops takes the legacy BusinessSummary shape (predates the
  // Postgres migration) — map from the real BusinessListItem the rest of
  // the app already uses rather than changing the component's contract.
  const { items } = await searchBusinesses({ sort: "rating", limit: 6 });
  const popularBusinesses: BusinessSummary[] = items.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    categorySlug: b.category.slug,
    categoryIcon: b.category.icon,
    categoryTone: b.category.tone,
    district: b.district,
    coverUrl: b.coverUrl,
    ratingAvg: b.ratingAvg,
    ratingCount: b.ratingCount,
    isVerified: b.isVerified,
    hasDelivery: b.amenities.includes("delivery"),
    hasEmergency: b.amenities.includes("emergency"),
    openNow: b.openStatus.isOpen,
  }));

  return (
    <>
      <Hero />
      <CategoryGrid />
      <PopularShops businesses={popularBusinesses} />
      <HomeCta />
    </>
  );
}
