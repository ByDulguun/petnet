import { getTranslations } from "next-intl/server";
import { BadgeCheck, MapPin, Star, Truck, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { BusinessCoverImage } from "@/components/shared/business-cover-image";
import { SectionHeading } from "@/components/shared/section-heading";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { Link } from "@/i18n/navigation";
import type { BusinessSummary } from "@/lib/types";

export async function PopularShops({ businesses }: { businesses: BusinessSummary[] }) {
  const t = await getTranslations("home.popular");
  const tCategories = await getTranslations("categories");
  const tDistricts = await getTranslations("districts");

  return (
    <section className="container-page py-16 lg:py-20" aria-labelledby="popular">
      <SectionHeading
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        href="/map"
        hrefLabel={t("cta")}
      />

      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {businesses.map((biz) => (
          <StaggerItem key={biz.id}>
            <Link
              href={`/business/${biz.slug}`}
              className="group block overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <BusinessCoverImage
                  coverUrl={biz.coverUrl}
                  name={biz.name}
                  category={{ icon: biz.categoryIcon, tone: biz.categoryTone }}
                  sizes="(min-width: 1024px) 20rem, (min-width: 640px) 50vw, 100vw"
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                <Badge className="absolute top-3 left-3 rounded-full border-0 bg-black/55 font-medium text-white backdrop-blur-sm">
                  {tCategories.has(biz.categorySlug)
                    ? tCategories(biz.categorySlug)
                    : biz.categorySlug}
                </Badge>
                {biz.hasEmergency && (
                  <Badge className="absolute top-3 right-3 rounded-full border-0 bg-danger font-semibold text-white">
                    <Zap className="size-3" aria-hidden="true" />
                    24/7
                  </Badge>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="flex min-w-0 items-center gap-1.5 font-bold">
                    <span className="truncate">{biz.name}</span>
                    {biz.isVerified && (
                      <BadgeCheck
                        className="size-4.5 shrink-0 text-brand-blue"
                        aria-label={t("verified")}
                      />
                    )}
                  </h3>
                </div>

                <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
                  <span className="font-semibold text-foreground">
                    {biz.ratingAvg.toFixed(1)}
                  </span>
                  <span>({biz.ratingCount})</span>
                  <span aria-hidden="true">·</span>
                  <MapPin className="size-3.5" aria-hidden="true" />
                  <span className="truncate">
                    {tDistricts.has(biz.district) ? tDistricts(biz.district) : biz.district}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs font-medium">
                  <span
                    className={
                      biz.openNow
                        ? "inline-flex items-center gap-1.5 text-success"
                        : "inline-flex items-center gap-1.5 text-muted-foreground"
                    }
                  >
                    <span
                      aria-hidden="true"
                      className={
                        biz.openNow
                          ? "size-1.5 rounded-full bg-success"
                          : "size-1.5 rounded-full bg-muted-foreground/50"
                      }
                    />
                    {biz.openNow ? t("openNow") : t("closed")}
                  </span>
                  {biz.hasDelivery && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Truck className="size-3.5" aria-hidden="true" />
                      {t("delivery")}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
