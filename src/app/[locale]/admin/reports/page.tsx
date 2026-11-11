import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminNav } from "@/features/admin/components/admin-nav";
import { ReportsList } from "@/features/admin/components/reports-list";
import { requireAdmin } from "@/lib/session";
import { getOpenReports } from "@/server/services/report-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminReports" });
  return { title: t("title") };
}

export default async function AdminReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin("/admin/reports");
  const t = await getTranslations("adminReports");
  const reports = await getOpenReports();

  return (
    <div className="container-page max-w-2xl py-10 lg:py-14">
      <AdminNav active="reports" />
      <h1 className="mb-8 text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
      <ReportsList initial={reports} />
    </div>
  );
}
