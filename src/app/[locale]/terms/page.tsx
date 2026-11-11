import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LegalPage } from "@/components/shared/legal-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legalTerms" });
  return { title: t("title") };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legalTerms");

  return (
    <LegalPage
      title={t("title")}
      updated={t("updated")}
      intro={t("intro")}
      sections={t.raw("sections") as { heading: string; body: string }[]}
      disclaimer={t("disclaimer")}
    />
  );
}
