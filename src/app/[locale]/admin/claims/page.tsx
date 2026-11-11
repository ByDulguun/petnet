import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminNav } from "@/features/admin/components/admin-nav";
import { ClaimsList } from "@/features/admin/components/claims-list";
import { requireAdmin } from "@/lib/session";
import { getPendingClaims } from "@/server/services/business-claim-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminClaims" });
  return { title: t("title") };
}

export default async function AdminClaimsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin("/admin/claims");
  const t = await getTranslations("adminClaims");
  const claims = await getPendingClaims();

  return (
    <div className="container-page max-w-2xl py-10 lg:py-14">
      <AdminNav active="claims" />
      <h1 className="mb-8 text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
      <ClaimsList initial={claims} />
    </div>
  );
}
