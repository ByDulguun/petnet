import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdoptionListingForm } from "@/features/adoption/components/adoption-listing-form";
import { AdoptionStatusSelect } from "@/features/adoption/components/adoption-status-select";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { requireBusinessOwner } from "@/lib/session";
import { getAdoptionListingForOwner } from "@/server/services/adoption-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "businessAdoption" });
  return { title: t("editTitle") };
}

export default async function EditAdoptionListingPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { business } = await requireBusinessOwner(`/business/dashboard/adoption/${id}/edit`);
  const t = await getTranslations("businessAdoption");

  const [listing, breeds] = await Promise.all([
    getAdoptionListingForOwner(id, business.id),
    prisma.breed.findMany({ select: { id: true, name: true, species: true }, orderBy: { name: "asc" } }),
  ]);
  if (!listing) notFound();

  return (
    <div className="container-page max-w-lg py-10 lg:py-14">
      <Link
        href="/business/dashboard/adoption"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("backToList")}
      </Link>

      <div className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("editTitle")}</h1>
        <AdoptionStatusSelect listingId={listing.id} status={listing.status} />
      </div>

      <AdoptionListingForm
        breeds={breeds}
        initial={{
          id: listing.id,
          petId: listing.pet.id,
          petName: listing.pet.name,
          species: listing.pet.species,
          gender: listing.pet.gender,
          breedId: listing.pet.breedId,
          story: listing.story,
          goodWith: listing.goodWith,
          feeMnt: listing.feeMnt,
          avatarUrl: listing.pet.avatarUrl,
        }}
      />
    </div>
  );
}
