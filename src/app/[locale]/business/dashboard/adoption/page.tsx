import type { Metadata } from "next";
import { Heart, ListChecks, PawPrint, Plus, Settings2 } from "lucide-react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Link } from "@/i18n/navigation";
import { requireBusinessOwner } from "@/lib/session";
import { cn } from "@/lib/utils";
import { getAdoptionListingsForBusiness } from "@/server/services/adoption-service";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE: "bg-success-soft text-success",
  PENDING: "bg-warning-soft text-warning",
  ADOPTED: "bg-secondary text-muted-foreground",
};

const STATUS_KEY = {
  AVAILABLE: "statusAvailable",
  PENDING: "statusPending",
  ADOPTED: "statusAdopted",
} as const;

const SPECIES_KEY = { DOG: "speciesDog", CAT: "speciesCat", OTHER: "speciesOther" } as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "businessAdoption" });
  return { title: t("title") };
}

export default async function BusinessAdoptionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { business } = await requireBusinessOwner("/business/dashboard/adoption");
  const t = await getTranslations("businessAdoption");
  const listings = await getAdoptionListingsForBusiness(business.id);

  return (
    <div className="container-page max-w-3xl py-10 lg:py-14">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
        <Button className="rounded-full font-semibold" asChild>
          <Link href="/business/dashboard/adoption/new">
            <Plus className="size-4" />
            {t("addListing")}
          </Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t("emptyTitle")}
          description={t("emptyDesc")}
          action={
            <Button className="rounded-full font-semibold" asChild>
              <Link href="/business/dashboard/adoption/new">
                <Plus className="size-4" />
                {t("addListing")}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="flex items-center gap-4 rounded-3xl border bg-card p-4">
              <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
                {listing.pet.avatarUrl ? (
                  <Image src={listing.pet.avatarUrl} alt="" fill sizes="4rem" className="object-cover" />
                ) : (
                  <PawPrint className="size-6 text-muted-foreground" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{listing.pet.name}</p>
                  <Badge className={cn("rounded-full font-semibold", STATUS_STYLE[listing.status])}>
                    {t(STATUS_KEY[listing.status])}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {listing.pet.breed?.name ?? t(SPECIES_KEY[listing.pet.species])}
                  {" · "}
                  {t("applicationCount", { count: listing._count.applications })}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button size="sm" variant="outline" className="rounded-full font-semibold" asChild>
                  <Link href={`/business/dashboard/adoption/${listing.id}/applications`}>
                    <ListChecks className="size-4" />
                    {t("applicationsButton")}
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="rounded-full font-semibold" asChild>
                  <Link href={`/business/dashboard/adoption/${listing.id}/edit`}>
                    <Settings2 className="size-4" />
                    {t("editButton")}
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
