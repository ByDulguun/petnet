import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";

import { SectionHeading } from "@/components/shared/section-heading";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { Link } from "@/i18n/navigation";
import { SERVICE_CATEGORY_TILES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export async function CategoryGrid() {
  const t = await getTranslations("home.categories");

  return (
    <section className="container-page py-16 lg:py-20" aria-labelledby="categories">
      <SectionHeading
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        href="/map"
        hrefLabel={t("cta")}
      />

      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {SERVICE_CATEGORY_TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <StaggerItem key={tile.slug}>
              <Link
                href={tile.href}
                className="group flex h-full flex-col rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-lifted"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                      tile.tone,
                    )}
                  >
                    <Icon className="size-5.5" aria-hidden="true" />
                  </div>
                  <ArrowUpRight
                    className="size-4 text-muted-foreground/0 transition-all duration-300 group-hover:text-brand"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-4 font-bold">{t(tile.labelKey)}</h3>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {t(tile.descriptionKey)}
                </p>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}
