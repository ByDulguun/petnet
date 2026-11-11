import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LostFoundForm } from "@/features/lost-found/components/lost-found-form";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/session";
import { getLostFoundReportForOwner } from "@/server/services/lost-found-service";

// Owner-specific, ownership-checked — never prerender or cache this route.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "lostFound" });
  return { title: t("editTitle") };
}

export default async function EditLostFoundPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireUser(`/lost-found/${id}/edit`);
  const t = await getTranslations("lostFound");

  const report = await getLostFoundReportForOwner(id, user.id);
  if (!report) notFound();

  return (
    <div className="container-page max-w-lg py-10 lg:py-14">
      <Link
        href={`/lost-found/${id}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("backToReport")}
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t("editTitle")}
      </h1>
      <LostFoundForm
        initial={{
          id: report.id,
          type: report.type,
          petName: report.petName,
          species: report.species,
          breedName: report.breedName,
          color: report.color,
          description: report.description,
          lastSeenAt: report.lastSeenAt.toISOString().slice(0, 10),
          address: report.address,
          district: report.district,
          rewardMnt: report.rewardMnt,
          phone: report.phone,
          images: report.images.map((img) => ({ id: img.id, url: img.url })),
        }}
      />
    </div>
  );
}
