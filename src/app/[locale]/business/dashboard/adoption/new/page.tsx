import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdoptionListingForm } from "@/features/adoption/components/adoption-listing-form";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { requireBusinessOwner } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "businessAdoption" });
  return { title: t("newTitle") };
}

export default async function NewAdoptionListingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireBusinessOwner("/business/dashboard/adoption/new");
  const t = await getTranslations("businessAdoption");
  const breeds = await prisma.breed.findMany({
    select: { id: true, name: true, species: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container-page max-w-lg py-10 lg:py-14">
      <Link
        href="/business/dashboard/adoption"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("backToList")}
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t("newTitle")}
      </h1>
      <AdoptionListingForm breeds={breeds} />
    </div>
  );
}
