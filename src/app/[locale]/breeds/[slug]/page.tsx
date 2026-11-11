import type { Metadata } from "next";
import { Check, ChevronLeft, PawPrint, X } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { BreedRating } from "@/features/breeds/components/breed-rating";
import { Link } from "@/i18n/navigation";
import { getBreedBySlug } from "@/server/services/breed-service";

const SPECIES_KEY = { DOG: "speciesDog", CAT: "speciesCat", OTHER: "speciesOther" } as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "breeds" });
  const breed = await getBreedBySlug(slug);
  if (!breed) return { title: t("title") };
  return {
    title: `${breed.name} — ${t("title")}`,
    description: breed.summary,
  };
}

export default async function BreedDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("breeds");

  const breed = await getBreedBySlug(slug);
  if (!breed) notFound();

  const ratings: [string, number | null][] = [
    [t("exerciseNeeds"), breed.exerciseNeeds],
    [t("groomingNeeds"), breed.groomingNeeds],
    [t("trainability"), breed.trainability],
    [t("friendliness"), breed.friendliness],
    [t("sheddingLevel"), breed.sheddingLevel],
  ];
  const hasRatings = ratings.some(([, v]) => v != null);
  const hasQuickFacts = breed.lifeExpectancy || breed.weightRange || breed.heightRange;

  return (
    <div className="container-page max-w-3xl py-8 lg:py-12">
      <Link
        href="/breeds"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("backToList")}
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl bg-secondary">
        {breed.coverImage ? (
          <div className="relative aspect-[16/9]">
            <Image src={breed.coverImage} alt="" fill priority sizes="(min-width: 1024px) 48rem, 100vw" className="object-cover" />
          </div>
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center">
            <PawPrint className="size-14 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}
      </div>

      <header className="mt-6">
        <Badge variant="secondary" className="rounded-full font-semibold">
          {t(SPECIES_KEY[breed.species])}
        </Badge>
        <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
          {breed.name}
        </h1>
        {breed.nameMn && <p className="mt-0.5 text-muted-foreground">{breed.nameMn}</p>}
        <p className="mt-3 leading-relaxed text-muted-foreground">{breed.summary}</p>
        {breed.temperament.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {breed.temperament.map((tag) => (
              <Badge key={tag} className="rounded-full border-0 bg-brand-soft font-semibold text-brand">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_16rem]">
        <div className="min-w-0 space-y-8">
          {breed.history && (
            <section>
              <h2 className="text-lg font-bold">{t("historyHeading")}</h2>
              <p className="mt-2 leading-relaxed whitespace-pre-line text-muted-foreground">{breed.history}</p>
            </section>
          )}

          {(breed.pros.length > 0 || breed.cons.length > 0) && (
            <section className="grid gap-6 sm:grid-cols-2">
              {breed.pros.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold">{t("prosHeading")}</h2>
                  <ul className="mt-2 space-y-1.5">
                    {breed.pros.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {breed.cons.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold">{t("consHeading")}</h2>
                  <ul className="mt-2 space-y-1.5">
                    {breed.cons.map((c) => (
                      <li key={c} className="flex items-start gap-2 text-sm">
                        <X className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {breed.nutrition && (
            <section>
              <h2 className="text-lg font-bold">{t("nutritionHeading")}</h2>
              <p className="mt-2 leading-relaxed whitespace-pre-line text-muted-foreground">{breed.nutrition}</p>
            </section>
          )}

          {(breed.healthOverview || breed.commonDiseases.length > 0) && (
            <section>
              <h2 className="text-lg font-bold">{t("healthHeading")}</h2>
              {breed.healthOverview && (
                <p className="mt-2 leading-relaxed whitespace-pre-line text-muted-foreground">{breed.healthOverview}</p>
              )}
              {breed.commonDiseases.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {breed.commonDiseases.map((d) => (
                    <Badge key={d} variant="secondary" className="rounded-full font-medium">
                      {d}
                    </Badge>
                  ))}
                </div>
              )}
            </section>
          )}

          {breed.images.length > 0 && (
            <section>
              <h2 className="text-lg font-bold">{t("galleryHeading")}</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {breed.images.map((img) => (
                  <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl">
                    <Image src={img.url} alt="" fill sizes="12rem" className="object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          {hasQuickFacts && (
            <div className="space-y-2.5 rounded-2xl border bg-card p-4 text-sm">
              <h2 className="font-bold">{t("quickFactsHeading")}</h2>
              {breed.lifeExpectancy && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{t("lifeExpectancy")}</span>
                  <span className="font-semibold">{breed.lifeExpectancy}</span>
                </div>
              )}
              {breed.weightRange && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{t("weightRange")}</span>
                  <span className="font-semibold">{breed.weightRange}</span>
                </div>
              )}
              {breed.heightRange && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{t("heightRange")}</span>
                  <span className="font-semibold">{breed.heightRange}</span>
                </div>
              )}
            </div>
          )}

          {hasRatings && (
            <div className="space-y-2.5 rounded-2xl border bg-card p-4">
              <h2 className="text-sm font-bold">{t("ratingsHeading")}</h2>
              {ratings.map(([label, value]) => (
                <BreedRating key={label} label={label} value={value} />
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
