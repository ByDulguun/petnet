import type { Metadata } from "next";
import { ChevronLeft, ListChecks, PawPrint, Store } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdoptionApplySection } from "@/features/adoption/components/adoption-apply-section";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { cn, formatMnt } from "@/lib/utils";
import {
  getAdoptionListingById,
  getApplicationForUser,
} from "@/server/services/adoption-service";

// Application/status state changes any time — never prerender or cache.
export const dynamic = "force-dynamic";

const SPECIES_KEY = { DOG: "speciesDog", CAT: "speciesCat", OTHER: "speciesOther" } as const;
const GENDER_KEY = { MALE: "genderMale", FEMALE: "genderFemale", UNKNOWN: "genderUnknown" } as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "adoption" });
  const listing = await getAdoptionListingById(id);
  if (!listing) return { title: t("title") };
  return { title: `${listing.pet.name} — ${t("title")}` };
}

export default async function AdoptionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("adoption");
  const tDistricts = await getTranslations("districts");

  const [listing, session] = await Promise.all([getAdoptionListingById(id), auth()]);
  if (!listing) notFound();

  const isOwner = session?.user?.id === listing.business.ownerId;
  const existingApplication = session?.user && !isOwner
    ? await getApplicationForUser(id, session.user.id)
    : null;
  const districtName =
    listing.business.district && tDistricts.has(listing.business.district)
      ? tDistricts(listing.business.district)
      : listing.business.district;

  return (
    <div className="container-page max-w-3xl py-8 lg:py-12">
      <Link
        href="/adoption"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("backToList")}
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl bg-secondary">
        {listing.pet.avatarUrl ? (
          <div className="relative aspect-[16/10]">
            <Image
              src={listing.pet.avatarUrl}
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 48rem, 100vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-[16/10] items-center justify-center">
            <PawPrint className="size-14 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}
      </div>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {listing.status === "PENDING" && (
              <Badge className="rounded-full border-0 bg-warning font-bold text-white">
                {t("statusPending")}
              </Badge>
            )}
            {listing.status === "ADOPTED" && (
              <Badge variant="secondary" className="rounded-full font-semibold">
                {t("statusAdopted")}
              </Badge>
            )}
          </div>
          <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
            {listing.pet.name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {[
              listing.pet.breed?.name ?? t(SPECIES_KEY[listing.pet.species]),
              t(GENDER_KEY[listing.pet.gender]),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <Link
            href={`/business/${listing.business.slug}`}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
          >
            <Store className="size-4" aria-hidden="true" />
            {districtName ? `${listing.business.name} · ${districtName}` : listing.business.name}
          </Link>
        </div>

        {isOwner && (
          <Button variant="outline" className="rounded-full font-semibold" asChild>
            <Link href={`/business/dashboard/adoption/${listing.id}/applications`}>
              <ListChecks className="size-4" />
              {t("viewApplications", { count: listing._count.applications })}
            </Link>
          </Button>
        )}
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-6">
          {listing.story && (
            <section>
              <h2 className="text-lg font-bold">{t("storyHeading")}</h2>
              <p className="mt-2 leading-relaxed whitespace-pre-line text-muted-foreground">
                {listing.story}
              </p>
            </section>
          )}

          {listing.goodWith.length > 0 && (
            <section>
              <h2 className="text-lg font-bold">{t("goodWithHeading")}</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {listing.goodWith.map((tag) => (
                  <Badge key={tag} variant="secondary" className={cn("rounded-full font-semibold")}>
                    {t(`goodWith_${tag}` as const)}
                  </Badge>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-3">
          {listing.feeMnt != null && (
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground">{t("feeLabel")}</p>
              <p className="mt-1 text-xl font-extrabold">
                {listing.feeMnt === 0 ? t("feeFree") : formatMnt(listing.feeMnt)}
              </p>
            </div>
          )}

          {!isOwner && (
            <AdoptionApplySection
              listingId={listing.id}
              listingStatus={listing.status}
              petName={listing.pet.name}
              isLoggedIn={Boolean(session?.user)}
              existingApplication={
                existingApplication
                  ? { id: existingApplication.id, status: existingApplication.status }
                  : null
              }
            />
          )}
        </aside>
      </div>
    </div>
  );
}
