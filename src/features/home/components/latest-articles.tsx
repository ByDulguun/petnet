import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/shared/section-heading";
import { Stagger, StaggerItem } from "@/components/shared/motion";
import { Link } from "@/i18n/navigation";
import type { ArticleSummary } from "@/lib/types";

export async function LatestArticles({ articles }: { articles: ArticleSummary[] }) {
  const t = await getTranslations("home.articles");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  });

  return (
    <section className="container-page py-16 lg:py-20" aria-labelledby="articles">
      <SectionHeading
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        href="/articles"
        hrefLabel={t("cta")}
      />

      <Stagger className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {articles.map((article) => (
          <StaggerItem key={article.id}>
            <Link
              href={`/articles/${article.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={article.coverImage}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 26rem, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-full font-medium text-brand-blue"
                  >
                    {article.categoryName}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    {t("minRead", { minutes: article.readMinutes })}
                  </span>
                </div>
                <h3 className="mt-3 text-lg leading-snug font-bold text-balance transition-colors group-hover:text-brand">
                  {article.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
                <p className="mt-auto pt-4 text-xs font-medium text-muted-foreground">
                  {dateFormatter.format(new Date(article.publishedAt))}
                </p>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
