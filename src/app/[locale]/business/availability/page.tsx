import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BusinessHoursForm } from "@/features/business/components/business-hours-form";
import { requireBusinessOwner } from "@/lib/session";
import { getBusinessHours } from "@/server/services/business-portal-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "businessAvailability" });
  return { title: t("title") };
}

export default async function BusinessAvailabilityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { business } = await requireBusinessOwner("/business/availability");
  const t = await getTranslations("businessAvailability");
  const hours = await getBusinessHours(business.id);

  return (
    <div className="container-page max-w-2xl py-10 lg:py-14">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
      <p className="mt-1.5 mb-8 text-sm text-muted-foreground">{t("subtitle")}</p>
      <BusinessHoursForm initial={hours} />
    </div>
  );
}
