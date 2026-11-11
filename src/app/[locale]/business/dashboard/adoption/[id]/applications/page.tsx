import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdoptionApplicationsList } from "@/features/adoption/components/adoption-applications-list";
import { Link } from "@/i18n/navigation";
import { requireBusinessOwner } from "@/lib/session";
import {
  getAdoptionListingForOwner,
  getApplicationsForListing,
} from "@/server/services/adoption-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "businessAdoption" });
  return { title: t("applicationsTitle") };
}

export default async function AdoptionApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { business } = await requireBusinessOwner(`/business/dashboard/adoption/${id}/applications`);
  const t = await getTranslations("businessAdoption");

  const listing = await getAdoptionListingForOwner(id, business.id);
  if (!listing) notFound();
  const applications = await getApplicationsForListing(id, business.id);
  if (!applications) notFound();

  return (
    <div className="container-page max-w-2xl py-10 lg:py-14">
      <Link
        href={`/business/dashboard/adoption/${id}/edit`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("backToListing")}
      </Link>
      <h1 className="mt-4 mb-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t("applicationsTitle")}
      </h1>
      <p className="mb-6 text-muted-foreground">{listing.pet.name}</p>

      <AdoptionApplicationsList listingId={id} initial={applications} />
    </div>
  );
}
