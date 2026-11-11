import type { Metadata } from "next";
import { format } from "date-fns";
import { CalendarDays, ChevronLeft, MapPin, PawPrint, Pencil, Phone } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LostFoundStatusAction } from "@/features/lost-found/components/lost-found-status-action";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { formatMnt } from "@/lib/utils";
import { getLostFoundReportById } from "@/server/services/lost-found-service";

// Status can change any time (reunited, reopened) — never prerender or cache.
export const dynamic = "force-dynamic";

const SPECIES_KEY = { DOG: "speciesDog", CAT: "speciesCat", OTHER: "speciesOther" } as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "lostFound" });
  const report = await getLostFoundReportById(id);
  if (!report) return { title: t("title") };
  const label = report.petName || t(SPECIES_KEY[report.species]);
  return { title: `${t(report.type === "LOST" ? "typeLost" : "typeFound")} — ${label}` };
}

export default async function LostFoundDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("lostFound");
  const tDistricts = await getTranslations("districts");

  const [report, session] = await Promise.all([getLostFoundReportById(id), auth()]);
  if (!report) notFound();

  const isOwner = session?.user?.id === report.reporterId;
  const districtName =
    report.district && tDistricts.has(report.district) ? tDistricts(report.district) : report.district;
  const [main, ...rest] = report.images;

  return (
    <div className="container-page max-w-3xl py-8 lg:py-12">
      <Link
        href="/lost-found"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("backToList")}
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl bg-secondary">
        {main ? (
          <div className="relative aspect-[16/10]">
            <Image
              src={main.url}
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
      {rest.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {rest.map((img) => (
            <div key={img.id} className="relative size-20 shrink-0 overflow-hidden rounded-xl">
              <Image src={img.url} alt="" fill sizes="5rem" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={
                report.type === "LOST"
                  ? "rounded-full border-0 bg-danger font-bold text-white"
                  : "rounded-full border-0 bg-success font-bold text-white"
              }
            >
              {t(report.type === "LOST" ? "typeLost" : "typeFound")}
            </Badge>
            {report.status !== "OPEN" && (
              <Badge variant="secondary" className="rounded-full font-semibold">
                {t(report.status === "REUNITED" ? "statusReunited" : "statusClosed")}
              </Badge>
            )}
          </div>
          <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
            {report.petName || t(SPECIES_KEY[report.species])}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {[t(SPECIES_KEY[report.species]), report.breedName, report.color].filter(Boolean).join(" · ")}
          </p>
        </div>

        {isOwner && (
          <div className="flex flex-wrap items-center gap-2">
            <LostFoundStatusAction reportId={report.id} status={report.status} />
            <Button variant="outline" className="rounded-full font-semibold" asChild>
              <Link href={`/lost-found/${report.id}/edit`}>
                <Pencil className="size-4" />
                {t("editButton")}
              </Link>
            </Button>
          </div>
        )}
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-6">
          <section>
            <h2 className="text-lg font-bold">{t("descriptionHeading")}</h2>
            <p className="mt-2 leading-relaxed whitespace-pre-line text-muted-foreground">
              {report.description}
            </p>
          </section>

          <section className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
              <span>{t("lastSeenOn", { date: format(report.lastSeenAt, "MMM d, yyyy") })}</span>
            </div>
            {(report.address || districtName) && (
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
                <span>{[report.address, districtName].filter(Boolean).join(", ")}</span>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-3">
          {report.rewardMnt ? (
            <div className="rounded-2xl border bg-warning-soft p-4">
              <p className="text-xs font-semibold text-warning">{t("rewardLabel")}</p>
              <p className="mt-1 text-xl font-extrabold text-warning">{formatMnt(report.rewardMnt)}</p>
            </div>
          ) : null}

          <Button className="w-full rounded-full font-semibold" asChild>
            <a href={`tel:${report.phone.replace(/\s/g, "")}`}>
              <Phone className="size-4" />
              {t("callButton", { phone: report.phone })}
            </a>
          </Button>
        </aside>
      </div>
    </div>
  );
}
