import type { Metadata } from "next";
import { PawPrint, Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { LostFoundCard } from "@/features/lost-found/components/lost-found-card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getLostFoundReports } from "@/server/services/lost-found-service";

// Everyone sees the same public board — content changes as reports come
// and go, never prerender or cache it.
export const dynamic = "force-dynamic";

const SPECIES_KEY = { DOG: "speciesDog", CAT: "speciesCat", OTHER: "speciesOther" } as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "lostFound" });
  return { title: t("title") };
}

export default async function LostFoundPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; species?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { type, species } = await searchParams;
  const t = await getTranslations("lostFound");

  const activeType = type === "LOST" || type === "FOUND" ? type : undefined;
  const activeSpecies =
    species === "DOG" || species === "CAT" || species === "OTHER" ? species : undefined;

  const reports = await getLostFoundReports({ type: activeType, species: activeSpecies });

  function filterHref(next: { type?: string; species?: string }) {
    const merged = { type: activeType, species: activeSpecies, ...next };
    const qs = new URLSearchParams();
    if (merged.type) qs.set("type", merged.type);
    if (merged.species) qs.set("species", merged.species);
    const s = qs.toString();
    return s ? `/lost-found?${s}` : "/lost-found";
  }

  const pillClass = (active: boolean) =>
    cn(
      "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
      active ? "border-brand bg-brand text-white" : "border-border bg-card hover:bg-secondary",
    );

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button className="rounded-full font-semibold" asChild>
          <Link href="/lost-found/new">
            <Plus className="size-4" />
            {t("reportButton")}
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link href={filterHref({ type: undefined })} className={pillClass(!activeType)}>
          {t("filterAll")}
        </Link>
        <Link href={filterHref({ type: "LOST" })} className={pillClass(activeType === "LOST")}>
          {t("typeLost")}
        </Link>
        <Link href={filterHref({ type: "FOUND" })} className={pillClass(activeType === "FOUND")}>
          {t("typeFound")}
        </Link>

        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

        {(["DOG", "CAT", "OTHER"] as const).map((s) => (
          <Link
            key={s}
            href={filterHref({ species: activeSpecies === s ? undefined : s })}
            className={pillClass(activeSpecies === s)}
          >
            {t(SPECIES_KEY[s])}
          </Link>
        ))}
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title={t("emptyTitle")}
          description={t("emptyDesc")}
          action={
            <Button className="rounded-full font-semibold" asChild>
              <Link href="/lost-found/new">
                <Plus className="size-4" />
                {t("reportButton")}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <LostFoundCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
