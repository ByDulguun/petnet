import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PetNetMark } from "@/components/brand/logo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage" });
  return { title: t("title") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("aboutPage");

  return (
    <article className="container-page max-w-3xl pt-8 pb-16 lg:pb-24">
      <header>
        <PetNetMark className="size-12" />
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t("lead")}</p>
      </header>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="text-lg font-bold tracking-tight">{t("todayTitle")}</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">{t("todayBody")}</p>
        </section>
        <section>
          <h2 className="text-lg font-bold tracking-tight">{t("nextTitle")}</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">{t("nextBody")}</p>
        </section>
        <section>
          <h2 className="text-lg font-bold tracking-tight">{t("teamTitle")}</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">{t("teamBody")}</p>
        </section>
      </div>
    </article>
  );
}
