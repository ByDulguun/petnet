import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BusinessServicesList } from "@/features/business/components/business-services-list";
import { requireBusinessOwner } from "@/lib/session";
import { getBusinessServices } from "@/server/services/business-portal-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "businessServices" });
  return { title: t("title") };
}

export default async function BusinessServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { business } = await requireBusinessOwner("/business/services");
  const t = await getTranslations("businessServices");
  const services = await getBusinessServices(business.id);

  return (
    <div className="container-page max-w-2xl py-10 lg:py-14">
      <h1 className="mb-8 text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
      <BusinessServicesList
        initial={services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          priceMnt: s.priceMnt,
          durationMin: s.durationMin,
          isActive: s.isActive,
        }))}
      />
    </div>
  );
}
